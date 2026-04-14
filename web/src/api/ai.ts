import { authFetch } from './client'

export type AiChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type PostAiBody =
  | { messages: AiChatTurn[]; projectId?: string }
  | { prompt: string; projectId?: string }

/** POST /api/v1/ai — `{ messages }` (or legacy `{ prompt }`) → `{ reply }` */
export async function postAI(body: PostAiBody): Promise<{ reply: string }> {
  return authFetch<{ reply: string }>(`/ai`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
