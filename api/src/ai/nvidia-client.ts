const CHAT_COMPLETIONS_URL =
  'https://integrate.api.nvidia.com/v1/chat/completions'

export type NvidiaToolCall = {
  id: string
  type?: string
  function?: { name?: string; arguments?: string }
}

export type NvidiaChatRequestMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | {
      role: 'assistant'
      content?: string | null
      tool_calls?: NvidiaToolCall[]
    }
  | { role: 'tool'; tool_call_id: string; content: string }

type NvidiaChatApiResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
      tool_calls?: NvidiaToolCall[]
    }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: { message?: string }
}

export type NvidiaUsageTotals = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

function shouldDebugPrompt(): boolean {
  return true
}

function redactTextSecrets(raw: string): string {
  let s = raw
  s = s.replaceAll(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    '[REDACTED_ID]'
  )
  s = s.replaceAll(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/g, 'Bearer [REDACTED]')
  s = s.replaceAll(
    /\b(access[_-]?token|api[_-]?key|secret|service[_-]?role[_-]?key|password)\b\s*[:=]\s*([^\s"'`]+)/gi,
    (_m, k) => `${String(k)}: [REDACTED]`
  )
  return s
}

function redactStructured(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return redactTextSecrets(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return value.map((v) => redactStructured(v))
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      const key = k.toLowerCase()
      const isSensitiveKey =
        key === 'authorization' ||
        key.includes('token') ||
        key.includes('secret') ||
        key.includes('apikey') ||
        key.includes('api_key') ||
        key.includes('password') ||
        key.includes('service_role')
      out[k] = isSensitiveKey ? '[REDACTED]' : redactStructured(v)
    }
    return out
  }
  return value
}

function usageFromResponse(data: NvidiaChatApiResponse): NvidiaUsageTotals {
  const u = data.usage
  const prompt = u?.prompt_tokens
  const completion = u?.completion_tokens
  const total = u?.total_tokens
  const promptTokens =
    typeof prompt === 'number' && Number.isFinite(prompt)
      ? Math.max(0, Math.floor(prompt))
      : 0
  const completionTokens =
    typeof completion === 'number' && Number.isFinite(completion)
      ? Math.max(0, Math.floor(completion))
      : 0
  let totalTokens =
    typeof total === 'number' && Number.isFinite(total)
      ? Math.max(0, Math.floor(total))
      : 0
  if (totalTokens === 0 && (promptTokens > 0 || completionTokens > 0)) {
    totalTokens = promptTokens + completionTokens
  }
  return { promptTokens, completionTokens, totalTokens }
}

/** Thrown when `NVIDIA_API_KEY` is missing — callers may map to HTTP 503. */
export class AiNotConfiguredError extends Error {
  override name = 'AiNotConfiguredError'
  constructor(message = 'AI is not configured (NVIDIA_API_KEY is not set).') {
    super(message)
  }
}

function requireNvidiaApiKey(): string {
  const key = process.env.NVIDIA_API_KEY
  if (!key) {
    throw new AiNotConfiguredError()
  }
  return key
}

function chatModel(): string {
  return process.env.NVIDIA_CHAT_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b'
  // 'google/gemma-4-31b-it'
}

function extractNvidiaErrorMessage(
  data: NvidiaChatApiResponse,
  res: Response
): string {
  return (
    data.error?.message ??
    (typeof data === 'object' && data !== null && 'message' in data
      ? String((data as { message?: string }).message)
      : res.statusText)
  )
}

/**
 * One chat/completions round (NVIDIA NIM, OpenAI-compatible).
 * When `tools` is non-empty, `tool_choice` defaults to `auto`.
 */
export async function runNimChatCompletion(input: {
  messages: NvidiaChatRequestMessage[]
  tools?: unknown[]
  tool_choice?:
    | 'auto'
    | 'none'
    | { type: 'function'; function: { name: string } }
}): Promise<{
  content: string | null | undefined
  tool_calls?: NvidiaToolCall[]
  usage: NvidiaUsageTotals
}> {
  const body: Record<string, unknown> = {
    model: chatModel(),
    messages: input.messages,
    max_tokens: 2048,
    temperature: 0.2,
    stream: false,
  }
  if (input.tools !== undefined && input.tools.length > 0) {
    body.tools = input.tools
    body.tool_choice = input.tool_choice ?? 'auto'
  }

  if (shouldDebugPrompt()) {
    const redacted = redactStructured(body)
    const json = JSON.stringify(redacted)
    const max = 12_000
    console.log(
      '[ai.debug_prompt] NVIDIA /v1/chat/completions body:',
      json.length > max ? `${json.slice(0, max)}…(truncated)` : json
    )
  }

  const res = await fetch(CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireNvidiaApiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await res.json().catch(() => ({}))) as NvidiaChatApiResponse

  if (!res.ok) {
    throw new Error(
      `NVIDIA API ${res.status}: ${extractNvidiaErrorMessage(data, res)}`
    )
  }

  const message = data.choices?.[0]?.message
  return {
    content: message?.content,
    tool_calls: message?.tool_calls,
    usage: usageFromResponse(data),
  }
}
