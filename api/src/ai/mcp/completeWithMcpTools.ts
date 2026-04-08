import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { McpClientLike } from './composite-client.js'
import {
  runNimChatCompletion,
  type NvidiaChatRequestMessage,
} from '../nvidia-client.js'

const MAX_TOOL_ROUNDS = 8

export const WORKBIT_AI_SYSTEM_PROMPT =
  'You are a Workbit assistant. Use the provided tools to read or update projects, issues, decisions, and status when the user asks about their workspace. Prefer calling tools over guessing. Format answers in clear Markdown: use `##` / `###` headings for sections, bullet or numbered lists for items, and Markdown tables when comparing rows of data (e.g. orders, line items). Keep paragraphs short.'

const SYSTEM_PROMPT = WORKBIT_AI_SYSTEM_PROMPT

export type CompleteWithMcpOptions = {
  /** Appended to the base system prompt (e.g. per-agent role). */
  systemPromptSuffix?: string
}

function buildSystemContent(suffix?: string): string {
  if (suffix?.trim()) {
    return `${SYSTEM_PROMPT}\n\n${suffix.trim()}`
  }
  return SYSTEM_PROMPT
}

/** Prior turns from the client (current user message is the last entry). */
export type AiChatTurn = { role: 'user' | 'assistant'; content: string }

type McpTool = Awaited<ReturnType<Client['listTools']>>['tools'][number]

function mcpTools(tools: McpTool[]): unknown[] {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description ?? t.name,
      parameters: t.inputSchema,
    },
  }))
}

async function listAllTools(client: McpClientLike): Promise<McpTool[]> {
  const out: McpTool[] = []
  let cursor: string | undefined
  do {
    const page = await client.listTools(cursor ? { cursor } : undefined)
    out.push(...page.tools)
    cursor = page.nextCursor
  } while (cursor)
  return out
}

function formatMcpToolResult(result: unknown): string {
  if (!result || typeof result !== 'object') {
    return '(invalid tool result)'
  }
  const r = result as {
    content?: Array<{ type: string; text?: string }>
    structuredContent?: Record<string, unknown>
    isError?: boolean
  }
  const blocks = Array.isArray(r.content) ? r.content : []
  const text = blocks
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
  if (text) return text
  if (r.structuredContent && Object.keys(r.structuredContent).length) {
    return JSON.stringify(r.structuredContent, null, 2)
  }
  return r.isError ? '(tool error, no details)' : '(empty tool result)'
}

function parseToolArguments(raw: string | undefined): Record<string, unknown> {
  if (raw === undefined || raw.trim() === '') return {}
  try {
    const v = JSON.parse(raw) as unknown
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      return v as Record<string, unknown>
    }
    return { _note: 'invalid tool arguments shape', raw }
  } catch {
    return { _note: 'invalid JSON in tool arguments', raw }
  }
}

function assertValidChatTurns(turns: AiChatTurn[]): void {
  if (turns.length === 0) {
    throw new Error('AI chat: messages must be non-empty.')
  }
  if (turns[turns.length - 1].role !== 'user') {
    throw new Error('AI chat: last message must be from the user.')
  }
}

export type CompleteWithMcpToolsResult = {
  reply: string
  /** Sum of provider-reported total_tokens across all NIM rounds in this request. */
  totalTokens: number
  attachments?: Array<
    | {
        kind: 'excalidraw'
        checkpointId: string
        shareUrl?: string
        excalidrawJson?: string
      }
    | {
        kind: 'mcp_app'
        /** Resource URI returned/declared by the MCP server (typically `ui://...`). */
        resourceUri: string
        /** HTML payload for rendering via `iframe srcDoc`. */
        html: string
        title?: string
      }
  >
}

function getToolUiResourceUri(tool: McpTool): string | null {
  const t = tool as unknown as { _meta?: { ui?: { resourceUri?: unknown } } }
  const uri = t?._meta?.ui?.resourceUri
  return typeof uri === 'string' && uri.trim() ? uri.trim() : null
}

function parseHtmlFromResource(
  result: unknown
): { html: string; title?: string } | null {
  if (!result || typeof result !== 'object') return null
  const r = result as {
    contents?: Array<{ type: string; text?: string; mimeType?: string }>
    content?: Array<{ type: string; text?: string; mimeType?: string }>
  }
  // SDK variants use either `contents` or `content`.
  const blocks = (
    Array.isArray(r.contents)
      ? r.contents
      : Array.isArray(r.content)
        ? r.content
        : []
  ) as Array<{
    type: string
    text?: string
    mimeType?: string
  }>
  const htmlBlock =
    blocks.find(
      (b) =>
        b.type === 'text' &&
        typeof b.mimeType === 'string' &&
        b.mimeType.includes('text/html')
    ) ??
    blocks.find(
      (b) =>
        b.type === 'text' &&
        typeof b.text === 'string' &&
        b.text.trim().startsWith('<')
    )
  const html = typeof htmlBlock?.text === 'string' ? htmlBlock.text : ''
  if (!html.trim()) return null
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const title = titleMatch?.[1]?.trim() || undefined
  return { html, title }
}

/**
 * Runs a tool-using chat loop: NIM proposes tool calls, MCP executes them, results go back until the model returns text.
 * `chatTurns` is the full visible conversation (user/assistant pairs), ending with the latest user message.
 */
export async function completePromptWithMcpTools(
  client: McpClientLike,
  chatTurns: AiChatTurn[],
  options?: CompleteWithMcpOptions
): Promise<CompleteWithMcpToolsResult> {
  assertValidChatTurns(chatTurns)

  const systemContent = buildSystemContent(options?.systemPromptSuffix)

  const baseMessages: NvidiaChatRequestMessage[] = [
    { role: 'system', content: systemContent },
    ...chatTurns.map(
      (m): NvidiaChatRequestMessage =>
        m.role === 'user'
          ? { role: 'user', content: m.content }
          : { role: 'assistant', content: m.content }
    ),
  ]

  let totalTokens = 0
  const attachments: CompleteWithMcpToolsResult['attachments'] = []

  const tools = await listAllTools(client)
  if (tools.length === 0) {
    const m = await runNimChatCompletion({
      messages: baseMessages,
    })
    totalTokens += m.usage.totalTokens
    return {
      reply: typeof m.content === 'string' ? m.content.trim() : '',
      totalTokens,
    }
  }

  const aiTools = mcpTools(tools)
  const messages: NvidiaChatRequestMessage[] = [...baseMessages]
  const toolByName = new Map<string, McpTool>(tools.map((t) => [t.name, t]))

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const {
      content,
      tool_calls: toolCalls,
      usage,
    } = await runNimChatCompletion({
      messages,
      tools: aiTools,
      tool_choice: 'auto',
    })
    totalTokens += usage.totalTokens

    if (!toolCalls?.length) {
      return {
        reply: typeof content === 'string' ? content.trim() : '',
        totalTokens,
      }
    }

    messages.push({
      role: 'assistant',
      content: content ?? null,
      tool_calls: toolCalls,
    })

    for (const tc of toolCalls) {
      const name = tc.function?.name
      const id = tc.id
      if (!name || !id) continue

      let toolText: string
      try {
        const args = parseToolArguments(tc.function?.arguments)
        const result = await client.callTool({ name, arguments: args })
        toolText = formatMcpToolResult(result)

        // MCP Apps: if tool declares a UI resource, fetch the HTML and attach it for inline rendering.
        const toolDef = name ? toolByName.get(name) : undefined
        const uiUri = toolDef ? getToolUiResourceUri(toolDef) : null
        if (uiUri && client.readResource) {
          try {
            const resource = await client.readResource({
              uri: uiUri,
              toolNameHint: name,
            })
            const parsed = parseHtmlFromResource(resource)
            if (parsed) {
              attachments?.push({
                kind: 'mcp_app',
                resourceUri: uiUri,
                html: parsed.html,
                ...(parsed.title ? { title: parsed.title } : {}),
              })
            }
          } catch {
            // Non-fatal: keep tool text only.
          }
        }

        // Static Excalidraw attachment: if create_view returns checkpointId, fetch JSON + share URL.
        if (name.endsWith('.create_view')) {
          const r = result as {
            structuredContent?: Record<string, unknown>
          } | null
          const checkpointId =
            r?.structuredContent &&
            typeof r.structuredContent.checkpointId === 'string'
              ? (r.structuredContent.checkpointId as string)
              : null
          if (checkpointId) {
            const prefix = name.split('.')[0]
            try {
              const checkpoint = (await client.callTool({
                name: `${prefix}.read_checkpoint`,
                arguments: { id: checkpointId },
              })) as { content?: Array<{ type: string; text?: string }> }
              const checkpointJson =
                Array.isArray(checkpoint?.content) &&
                checkpoint.content[0]?.type === 'text'
                  ? String(checkpoint.content[0]?.text ?? '')
                  : ''

              const exported = (await client.callTool({
                name: `${prefix}.export_to_excalidraw`,
                arguments: { json: checkpointJson || '{}' },
              })) as { content?: Array<{ type: string; text?: string }> }
              const shareUrl =
                Array.isArray(exported?.content) &&
                exported.content[0]?.type === 'text'
                  ? String(exported.content[0]?.text ?? '')
                  : undefined

              attachments?.push({
                kind: 'excalidraw',
                checkpointId,
                shareUrl,
                excalidrawJson: checkpointJson || undefined,
              })
            } catch {
              // If attachment generation fails, keep the text response only.
              attachments?.push({ kind: 'excalidraw', checkpointId })
            }
          }
        }
      } catch (e) {
        toolText =
          e instanceof Error
            ? `Tool invocation failed: ${e.message}`
            : 'Tool invocation failed.'
      }

      messages.push({
        role: 'tool',
        tool_call_id: id,
        content: toolText,
      })
    }
  }

  const final = await runNimChatCompletion({ messages })
  totalTokens += final.usage.totalTokens
  return {
    reply: typeof final.content === 'string' ? final.content.trim() : '',
    totalTokens,
    attachments: attachments?.length ? attachments : undefined,
  }
}
