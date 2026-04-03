const CHAT_COMPLETIONS_URL =
  'https://integrate.api.nvidia.com/v1/chat/completions'

type NvidiaChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>
  error?: { message?: string }
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
}

/**
 * Single user prompt → assistant text (NVIDIA NIM, OpenAI-compatible chat completions).
 * Requires `NVIDIA_API_KEY`. Optional `NVIDIA_CHAT_MODEL`.
 */
export async function completePrompt(prompt: string): Promise<string> {
  const res = await fetch(CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireNvidiaApiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: chatModel(),
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
      temperature: 0.2,
      stream: false,
    }),
  })

  const data = (await res.json().catch(() => ({}))) as NvidiaChatResponse

  if (!res.ok) {
    const msg =
      data.error?.message ??
      (typeof data === 'object' && data !== null && 'message' in data
        ? String((data as { message?: string }).message)
        : res.statusText)
    throw new Error(`NVIDIA API ${res.status}: ${msg}`)
  }

  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    return ''
  }
  return content.trim()
}
