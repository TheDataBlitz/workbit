import type { Request, Response } from 'express'
import { getUserId } from '../middleware/auth.js'
import * as usageModel from '../models/usage.js'
import { logApiError } from '../utils/log.js'

const AI_TOOLING_MAX_DAYS = 7

function parseDays(raw: unknown, fallback: number): number {
  const parsed = Number(
    typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : ''
  )
  return Number.isFinite(parsed)
    ? Math.min(AI_TOOLING_MAX_DAYS, Math.max(1, Math.floor(parsed)))
    : fallback
}

function parseShopId(raw: unknown): string | null {
  const v =
    typeof raw === 'string'
      ? raw.trim()
      : Array.isArray(raw) && typeof raw[0] === 'string'
        ? raw[0].trim()
        : ''
  return v.length > 0 ? v : null
}

export async function getAiToolingRounds(req: Request, res: Response) {
  try {
    const userId = getUserId(req, '')
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const days = parseDays(req.query.days, 7)
    const shopId = parseShopId(req.query.shopId)

    const report = await usageModel.getAiToolingRoundsReportForUser({
      userId,
      days,
      shopId,
    })
    res.json(report)
  } catch (e) {
    logApiError(e, 'usage.getAiToolingRounds')
    res.status(500).json({ error: (e as Error).message })
  }
}
