import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { McpClientLike } from './composite-client.js'
import {
  runNimChatCompletion,
  type NvidiaChatRequestMessage,
} from '../nvidia-client.js'

const MAX_TOOL_ROUNDS = 8
const MAX_TOOLSET_EXPANSIONS = 2

export const WORKBIT_AI_SYSTEM_PROMPT =
  'You are a Workbit assistant. Use the provided tools to read or update projects, issues, decisions, and status when the user asks about their workspace. Prefer calling tools over guessing.\n\nSecurity: never output internal IDs (UUIDs), database row ids, workspace/team/project/member ids, access tokens, API keys, or secrets. IMPORTANT: you MAY fetch IDs via tools and use them internally in tool calls; you MUST NOT reveal them in your final response.\n\nWhen the user asks to update issues (e.g., mark complete), do NOT ask for UUIDs. Instead:\n- Use tools to find the right project/team (e.g. getProject) and issues (e.g. getIssuesByProject / getIssue)\n- Match issues by safe identifiers like title, status, or order; if ambiguous, ask the user to choose by title\n- Then call updateIssue using the ID internally, and report results using titles (not IDs)\n\nFormat answers in clear Markdown: use `##` / `###` headings for sections, bullet or numbered lists for items, and Markdown tables when comparing rows of data (e.g. orders, line items). Keep paragraphs short.'

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

type ToolMeta = { name: string; description?: string | null }

const ALWAYS_INCLUDE_TOOLS = [
  // Baseline “discovery” + core issue workflow.
  'getProject',
  'getIssue',
  'getIssuesByProject',
  'createIssue',
  'updateIssue',
] as const

function safeJsonParseObject(raw: string): Record<string, unknown> | null {
  const s = raw.trim()
  const tryParse = (x: string): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(x) as unknown
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        return v as Record<string, unknown>
      }
    } catch {
      /* ignore */
    }
    return null
  }
  const direct = tryParse(s)
  if (direct) return direct
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start >= 0 && end > start) return tryParse(s.slice(start, end + 1))
  return null
}

function toolMetasFromTools(tools: McpTool[]): ToolMeta[] {
  return tools.map((t) => ({ name: t.name, description: t.description }))
}

function toolBuckets(): Record<
  'projects' | 'issues' | 'decisions' | 'docs' | 'members' | 'updates',
  readonly string[]
> {
  // Keep this list tight; it’s used to expand a selected set to reduce re-selection churn.
  return {
    projects: [
      'getProject',
      'createProject',
      'updateProject',
      'updateProjectStatus',
    ],
    issues: ['getIssue', 'getIssuesByProject', 'createIssue', 'updateIssue'],
    decisions: ['getDecision', 'createDecision', 'updateProjectDecision'],
    docs: [
      'getProjectDocuments',
      'getProjectDocument',
      'createProjectDocument',
      'updateProjectDocument',
    ],
    members: [
      'addTeamMember',
      'onboardMember',
      'addTeamMembersToProject',
      'assignProjectLead',
    ],
    updates: ['createProjectStatusUpdate', 'getProjectStatusUpdates'],
  }
}

function expandToolNamesByBucket(names: string[]): string[] {
  const buckets = toolBuckets()
  const byTool = new Map<string, keyof typeof buckets>()
  for (const [bucket, tools] of Object.entries(buckets) as Array<
    [keyof typeof buckets, readonly string[]]
  >) {
    for (const t of tools) byTool.set(t, bucket)
  }
  const wantBuckets = new Set<keyof typeof buckets>()
  for (const n of names) {
    const b = byTool.get(n)
    if (b) wantBuckets.add(b)
  }
  const out = new Set<string>(names)
  for (const b of wantBuckets) {
    for (const t of buckets[b]) out.add(t)
  }
  return [...out]
}

function formatToolListForSelection(metas: ToolMeta[]): string {
  // Keep descriptions minimal to avoid recreating the schema-token problem in selection.
  const lines = metas
    .map((t) => {
      const d = (t.description ?? '').trim().replaceAll(/\s+/g, ' ')
      const short = d.length > 80 ? `${d.slice(0, 80)}…` : d
      return short ? `- ${t.name}: ${short}` : `- ${t.name}`
    })
    .join('\n')
  return lines
}

async function selectToolNames(input: {
  baseMessages: NvidiaChatRequestMessage[]
  toolMetas: ToolMeta[]
}): Promise<{ toolNames: string[]; selectionTokens: number }> {
  const SELECTOR_SYSTEM = `You select the minimum set of tool names needed to satisfy the user's request.

You MUST respond with a single JSON object and no other text, in this exact shape:
{"tool_names":["toolA","toolB"]}

Rules:
- Choose as few tools as possible.
- If no tools are needed, return {"tool_names":[]} .`

  const toolList = formatToolListForSelection(input.toolMetas)
  const lastUser = [...input.baseMessages]
    .reverse()
    .find((m) => m.role === 'user')?.content
  const userBlock = `Available tools:\n${toolList}\n\nUser message:\n${
    typeof lastUser === 'string' ? lastUser : ''
  }`

  const res = await runNimChatCompletion({
    messages: [
      { role: 'system', content: SELECTOR_SYSTEM },
      { role: 'user', content: userBlock },
    ],
    tool_choice: 'none',
  })

  const text = typeof res.content === 'string' ? res.content : ''
  const parsed = safeJsonParseObject(text)
  const rawNames = Array.isArray(parsed?.tool_names)
    ? (parsed?.tool_names as unknown[])
    : []
  const toolNames = rawNames
    .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
    .map((n) => n.trim())

  return { toolNames, selectionTokens: res.usage.totalTokens }
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

  tooling: {
    selectionMode: 'none' | 'selected' | 'bucketed' | 'fallback_all'
    selectionTokens: number
    toolsTotalCount: number
    toolsSelectedCount: number
    toolsPayloadBytes: number
    toolRounds: number
    rounds: Array<{
      roundIndex: number
      toolsSelectedCount: number
      toolsPayloadBytes: number
      toolCallsCount: number
      totalTokens: number
      promptTokens: number
      completionTokens: number
    }>
  }
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
  const roundStats: CompleteWithMcpToolsResult['tooling']['rounds'] = []

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
      tooling: {
        selectionMode: 'none',
        selectionTokens: 0,
        toolsTotalCount: 0,
        toolsSelectedCount: 0,
        toolsPayloadBytes: 0,
        toolRounds: 0,
        rounds: [],
      },
    }
  }

  const toolByName = new Map(tools.map((t) => [t.name, t]))
  const allMetas = toolMetasFromTools(tools)

  // Tool-selection step: pick a minimal subset of tools to send as schemas.
  let selectionTokens = 0
  let selectedToolNames: string[] = []
  let selectionMode: CompleteWithMcpToolsResult['tooling']['selectionMode'] =
    'fallback_all'
  try {
    const sel = await selectToolNames({
      baseMessages,
      toolMetas: allMetas,
    })
    selectionTokens = sel.selectionTokens
    selectedToolNames = sel.toolNames
    selectionMode = 'selected'
  } catch {
    selectedToolNames = []
    selectionMode = 'fallback_all'
  }

  if (selectedToolNames.length === 0) {
    // If selector fails, keep token savings but ensure we can still fetch context.
    selectedToolNames = [...ALWAYS_INCLUDE_TOOLS]
    selectionMode = 'fallback_all'
  } else {
    // Expand selection by bucket to avoid repeated re-selection.
    selectedToolNames = expandToolNamesByBucket(selectedToolNames)
    selectionMode = 'bucketed'
  }

  // Always include baseline tools so the model can fetch IDs/context without asking the user.
  selectedToolNames = [
    ...new Set([...ALWAYS_INCLUDE_TOOLS, ...selectedToolNames]),
  ]

  // Filter to tools that actually exist.
  let selectedTools: McpTool[] = selectedToolNames
    .map((n) => toolByName.get(n))
    .filter((t): t is McpTool => Boolean(t))

  let aiTools = mcpTools(selectedTools)
  let toolsPayloadBytes = JSON.stringify(aiTools).length
  const messages: NvidiaChatRequestMessage[] = [...baseMessages]

  let expansions = 0

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
    roundStats.push({
      roundIndex: round,
      toolsSelectedCount: selectedTools.length,
      toolsPayloadBytes,
      toolCallsCount: toolCalls?.length ?? 0,
      totalTokens: usage.totalTokens,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
    })

    if (!toolCalls?.length) {
      return {
        reply: typeof content === 'string' ? content.trim() : '',
        totalTokens,
        promptTokens,
        completionTokens,
        tooling: {
          selectionMode,
          selectionTokens,
          toolsTotalCount: tools.length,
          toolsSelectedCount: selectedTools.length,
          toolsPayloadBytes,
          toolRounds: round + 1,
          rounds: roundStats,
        },
      }
    }

    // Progressive expansion: if the model asks for a tool we didn't include,
    // expand the toolset and retry the same round (without appending tool_calls).
    const missing: string[] = []
    for (const tc of toolCalls) {
      const name = tc.function?.name
      if (!name) continue
      const exists = toolByName.has(name)
      const included =
        selectedToolNames.length === 0 ||
        selectedToolNames.includes(name) ||
        selectedTools.some((t) => t.name === name)
      if (exists && !included) missing.push(name)
    }
    if (missing.length > 0 && expansions < MAX_TOOLSET_EXPANSIONS) {
      expansions++
      const expanded = expandToolNamesByBucket([
        ...selectedTools.map((t) => t.name),
        ...missing,
      ])
      selectedTools = expanded
        .map((n) => toolByName.get(n))
        .filter((t): t is McpTool => Boolean(t))
      aiTools = mcpTools(selectedTools)
      toolsPayloadBytes = JSON.stringify(aiTools).length
      continue
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
    tooling: {
      selectionMode,
      selectionTokens,
      toolsTotalCount: tools.length,
      toolsSelectedCount: selectedTools.length,
      toolsPayloadBytes,
      toolRounds: roundStats.length,
      rounds: roundStats,
    },
  }
}
