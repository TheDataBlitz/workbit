import { authFetch } from './client'

export type AiChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

/** POST /api/v1/ai — `{ messages }` (or legacy `{ prompt }`) → `{ reply }` */
export async function postAiPrompt(
  body: { messages: AiChatTurn[] } | { prompt: string }
): Promise<{ reply: string }> {
  return authFetch('/ai', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ reply: string }>
}
