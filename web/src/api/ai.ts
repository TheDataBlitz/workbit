import { getAccessToken } from './authStore'
import { ApiHttpError } from './client'

export type AiChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type PostAiBody =
  | { messages: AiChatTurn[]; projectId?: string; workspaceId?: string }
  | { prompt: string; projectId?: string; workspaceId?: string }

/** POST /api/v1/ai — `{ messages }` (or legacy `{ prompt }`) → `{ reply }` */
export async function postAI(body: PostAiBody): Promise<{ reply: string }> {
  const token = getAccessToken()
  const res = await fetch(`/api/v1/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiHttpError({
      status: res.status,
      message: payload.error || res.statusText,
      payload,
    })
  }
  return res.json() as Promise<{ reply: string }>
}

type SseFrame = { event?: string; data?: string }

type AiSsePayload = {
  content?: unknown
  reply?: unknown
  error?: unknown
}

function parseSseFrames(chunk: string): SseFrame[] {
  const blocks = chunk.split(/\n\n/)
  const frames: SseFrame[] = []
  for (const b of blocks) {
    const lines = b.split(/\r?\n/)
    let event: string | undefined
    const dataLines: string[] = []
    for (const raw of lines) {
      const line = raw.trimEnd()
      if (line.startsWith('event:')) event = line.slice('event:'.length).trim()
      if (line.startsWith('data:')) dataLines.push(line.slice('data:'.length).trimStart())
    }
    if (!event && dataLines.length === 0) continue
    frames.push({ event, data: dataLines.join('\n') })
  }
  return frames
}

export async function postAIStreaming(
  body: PostAiBody,
  handlers: {
    onDelta?: (delta: string) => void
    onStart?: (info: unknown) => void
    onError?: (message: string) => void
  } = {}
): Promise<{ reply: string }> {
  const token = getAccessToken()
  const res = await fetch(`/api/v1/ai?stream=1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string }
    throw new ApiHttpError({
      status: res.status,
      message: payload.error || res.statusText,
      payload,
    })
  }
  if (!res.body) throw new Error('Streaming response missing body.')

  const decoder = new TextDecoder()
  const reader = res.body.getReader()
  let buffer = ''
  let finalReply = ''

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // Keep last partial frame (no \n\n yet).
    const parts = buffer.split(/\n\n/)
    buffer = parts.pop() ?? ''
    for (const part of parts) {
      const frames = parseSseFrames(`${part}\n\n`)
      for (const f of frames) {
        if (!f.data) continue
        let parsed: AiSsePayload | null = null
        try {
          parsed = JSON.parse(f.data) as AiSsePayload
        } catch {
          continue
        }
        if (f.event === 'start') {
          handlers.onStart?.(parsed)
        } else if (f.event === 'delta') {
          const delta = typeof parsed?.content === 'string' ? parsed.content : ''
          if (delta) handlers.onDelta?.(delta)
        } else if (f.event === 'done') {
          finalReply = typeof parsed?.reply === 'string' ? parsed.reply : ''
          return { reply: finalReply }
        } else if (f.event === 'error') {
          const msg =
            typeof parsed?.error === 'string' ? parsed.error : 'AI streaming failed.'
          handlers.onError?.(msg)
          throw new Error(msg)
        }
      }
    }
  }

  return { reply: finalReply }
}
