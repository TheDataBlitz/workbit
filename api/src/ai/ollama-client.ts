import { logApiError, logApiWarn } from '../utils/log.js'

export type OllamaToolCall = {
  id: string
  type?: string
  function?: { name?: string; arguments?: string }
}

export type OllamaChatRequestMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | {
      role: 'assistant'
      content?: string | null
      tool_calls?: OllamaToolCall[]
    }
  | { role: 'tool'; tool_call_id: string; content: string }

type OllamaChatApiResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
      tool_calls?: OllamaToolCall[]
    }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  error?: { message?: string }
}

export type OllamaUsageTotals = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

/** Thrown when `OLLAMA_CHAT_MODEL` is missing — callers may map to HTTP 503. */
export class AiNotConfiguredError extends Error {
  override name = 'AiNotConfiguredError'
  constructor(
    message = 'AI is not configured (OLLAMA_CHAT_MODEL is not set).'
  ) {
    super(message)
  }
}

function shouldDebugPrompt(): boolean {
  return (
    process.env.AI_DEBUG_PROMPT === '1' ||
    process.env.AI_DEBUG_PROMPT === 'true'
  )
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

function usageFromResponse(data: OllamaChatApiResponse): OllamaUsageTotals {
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

function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434').replace(
    /\/$/,
    ''
  )
}

function requireOllamaModel(): string {
  const model = 'gemma4:e2b'
  if (!model) throw new AiNotConfiguredError()
  return model
}

function extractOllamaErrorMessage(
  data: OllamaChatApiResponse,
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
 * One chat/completions round against Ollama's OpenAI-compatible API.
 *
 * Expected env:
 * - `OLLAMA_BASE_URL` (optional, default http://127.0.0.1:11434)
 * - `OLLAMA_CHAT_MODEL` (required)
 */
export async function runOllamaChatCompletion(input: {
  messages: OllamaChatRequestMessage[]
  tools?: unknown[]
  tool_choice?:
    | 'auto'
    | 'none'
    | { type: 'function'; function: { name: string } }
}): Promise<{
  content: string | null | undefined
  tool_calls?: OllamaToolCall[]
  usage: OllamaUsageTotals
}> {
  const body: Record<string, unknown> = {
    model: requireOllamaModel(),
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
    try {
      const redacted = redactStructured(body)
      const json = JSON.stringify(redacted)
      const max = 12_000
      logApiWarn('[ai.debug_prompt] OLLAMA /v1/chat/completions body', {
        bytes: json.length,
        body: json.length > max ? `${json.slice(0, max)}…(truncated)` : json,
      })
    } catch (e) {
      logApiError(e, 'ai.debug_prompt.ollama')
    }
  }

  const url = `${ollamaBaseUrl()}/v1/chat/completions`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    logApiError(e, 'ollama.fetch', { url })
    throw e instanceof Error ? e : new Error(String(e))
  }

  const data = (await res.json().catch(() => ({}))) as OllamaChatApiResponse

  if (!res.ok) {
    const message = extractOllamaErrorMessage(data, res)
    logApiWarn('Ollama API error', {
      status: res.status,
      statusText: res.statusText,
    })
    throw new Error(`Ollama API ${res.status}: ${message}`)
  }

  const message = data.choices?.[0]?.message
  return {
    content: message?.content,
    tool_calls: message?.tool_calls,
    usage: usageFromResponse(data),
  }
}
