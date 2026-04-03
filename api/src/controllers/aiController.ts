import type { Request, Response } from 'express'
import { AiNotConfiguredError, completePrompt } from '../ai/client.js'
import { logApiError } from '../utils/log.js'

/** POST /api/v1/ai — body: `{ "prompt": string }` → `{ "reply": string }` */
export async function postAi(req: Request, res: Response) {
  try {
    const body = req.body as { prompt?: unknown }
    if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
      res.status(400).json({ error: 'prompt is required (non-empty string).' })
      return
    }

    const reply = await completePrompt(body.prompt.trim())
    res.json({ reply })
  } catch (e) {
    if (e instanceof AiNotConfiguredError) {
      res.status(503).json({ error: e.message })
      return
    }
    logApiError(e, 'ai.postAi')
    res.status(500).json({
      error: e instanceof Error ? e.message : 'AI request failed.',
    })
  }
}
