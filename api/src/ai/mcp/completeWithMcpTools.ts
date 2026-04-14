import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { McpClientLike } from './composite-client.js'
import {
  runNimChatCompletion,
  type NvidiaChatRequestMessage,
} from '../nvidia-client.js'

const MAX_TOOL_ROUNDS = 8

export const WORKBIT_AI_SYSTEM_PROMPT =
  'You are a Workbit assistant. Use the provided tools to read or update projects, issues, decisions, and status when the user asks about their workspace. Prefer calling tools over guessing. Security: never output internal IDs (UUIDs), database row ids, workspace/team/project/member ids, access tokens, API keys, or secrets. If a user asks for an ID/token, explain you cannot share it and instead provide safe identifiers (names, titles) or take an action via tools. Format answers in clear Markdown: use `##` / `###` headings for sections, bullet or numbered lists for items, and Markdown tables when comparing rows of data (e.g. orders, line items). Keep paragraphs short.'

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

function redactTextSecrets(raw: string): string {
  let s = raw

  // UUID v4-ish
  s = s.replaceAll(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    '[REDACTED_ID]'
  )

  // Bearer tokens
  s = s.replaceAll(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/g, 'Bearer [REDACTED]')

  // Common secret fields in text blobs (best-effort)
  s = s.replaceAll(
    /\b(access[_-]?token|api[_-]?key|secret|service[_-]?role[_-]?key|password)\b\s*[:=]\s*([^\s"'`]+)/gi,
    (_m, k) => `${String(k)}: [REDACTED]`
  )

  return s
}

function redactStructuredSecrets(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return redactTextSecrets(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map((v) => redactStructuredSecrets(v))
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      const key = k.toLowerCase()
      const isSensitiveKey =
        key === 'id' ||
        key.endsWith('_id') ||
        key.endsWith('id') ||
        key.includes('token') ||
        key.includes('secret') ||
        key.includes('apikey') ||
        key.includes('api_key') ||
        key.includes('password') ||
        key.includes('service_role')
      out[k] = isSensitiveKey ? '[REDACTED]' : redactStructuredSecrets(v)
    }
    return out
  }
  return value
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
  if (text) return redactTextSecrets(text)
  if (r.structuredContent && Object.keys(r.structuredContent).length) {
    return JSON.stringify(redactStructuredSecrets(r.structuredContent), null, 2)
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
  /** Sum of provider-reported prompt tokens across all rounds. */
  promptTokens: number
  /** Sum of provider-reported completion tokens across all rounds. */
  completionTokens: number
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
  let promptTokens = 0
  let completionTokens = 0

  const tools = await listAllTools(client)
  if (tools.length === 0) {
    const m = await runNimChatCompletion({
      messages: baseMessages,
    })
    totalTokens += m.usage.totalTokens
    promptTokens += m.usage.promptTokens
    completionTokens += m.usage.completionTokens
    return {
      reply: typeof m.content === 'string' ? m.content.trim() : '',
      totalTokens,
      promptTokens,
      completionTokens,
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
    promptTokens += usage.promptTokens
    completionTokens += usage.completionTokens

    if (!toolCalls?.length) {
      return {
        reply: typeof content === 'string' ? content.trim() : '',
        totalTokens,
        promptTokens,
        completionTokens,
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
  promptTokens += final.usage.promptTokens
  completionTokens += final.usage.completionTokens
  return {
    reply: typeof final.content === 'string' ? final.content.trim() : '',
    totalTokens,
    promptTokens,
    completionTokens,
  }
}
