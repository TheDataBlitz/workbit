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
  }
}
