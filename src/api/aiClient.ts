import { authFetch } from './client'

export type AiChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type PostAiBody =
  | { messages: AiChatTurn[]; projectId?: string; shopId?: string }
  | { prompt: string; projectId?: string; shopId?: string }

export type PostAiUsage = {
  tokens: number
  intelebits: number
  /** % of workspace monthly Intelebit cap used (UTC month), after this request. */
  usagePercent: number
  monthlyBudget: {
    capIntelebits: number
    usedIntelebits: number
    usagePercent: number
  } | null
}

/** POST /api/v1/ai — `{ messages }` (or legacy `{ prompt }`) → `{ reply, usage? }` */
export async function postAiPrompt(body: PostAiBody): Promise<{
  reply: string
  usage?: PostAiUsage
}> {
  return authFetch('/ai', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{
    reply: string
    usage?: PostAiUsage
  }>
}
