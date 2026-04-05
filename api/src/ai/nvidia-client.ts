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
