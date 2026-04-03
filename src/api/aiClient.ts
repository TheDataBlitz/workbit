import { authFetch } from './client'

/** POST /api/v1/ai — `{ prompt }` → `{ reply }` */
export async function postAiPrompt(prompt: string): Promise<{ reply: string }> {
  return authFetch('/ai', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  }) as Promise<{ reply: string }>
}
