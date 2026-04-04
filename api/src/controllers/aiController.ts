import type { Request, Response } from 'express'
import { AiNotConfiguredError } from '../ai/nvidia-client.js'
import {
  completePromptWithMcpTools,
  type AiChatTurn,
} from '../ai/mcp/completeWithMcpTools.js'
import { withMcpClient } from '../ai/mcp/workbit-mcp-client.js'
import { logApiError } from '../utils/log.js'

/** Cap how many turns we send to NIM to limit tokens (each turn is user or assistant). */
const MAX_CHAT_MESSAGES = 48

function parseAiChatBody(body: unknown): AiChatTurn[] | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  if (Array.isArray(b.messages)) {
    const out: AiChatTurn[] = []
    for (const item of b.messages) {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      if (row.role !== 'user' && row.role !== 'assistant') return null
      if (typeof row.content !== 'string' || !row.content.trim()) return null
      out.push({
        role: row.role,
        content: row.content.trim(),
      })
    }
    if (out.length === 0) return null
    if (out[out.length - 1].role !== 'user') return null
    return out.length > MAX_CHAT_MESSAGES ? out.slice(-MAX_CHAT_MESSAGES) : out
  }

  if (typeof b.prompt === 'string' && b.prompt.trim()) {
    return [{ role: 'user', content: b.prompt.trim() }]
  }

  return null
}

/**
 * POST /api/v1/ai — body: `{ messages: [{ role, content }, ...] }` or legacy `{ prompt }` → `{ reply }`.
 * Last message must be `user`. Uses Workbit MCP + NIM.
 */
export async function postAi(req: Request, res: Response) {
  try {
    const turns = parseAiChatBody(req.body)
    if (!turns) {
      res.status(400).json({
        error:
          'Send { messages: [{ role: "user"|"assistant", content: string }, ...] } with a non-empty final user message, or legacy { prompt: string }.',
      })
      return
    }

    const auth = req.workbitUpstreamAuth
    if (!auth) {
      logApiError(new Error('postAi: missing workbitUpstreamAuth'), 'ai.postAi')
      res.status(500).json({ error: 'Invalid auth state for AI.' })
      return
    }

    const reply = await withMcpClient(auth, (c) =>
      completePromptWithMcpTools(c, turns)
    )
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
