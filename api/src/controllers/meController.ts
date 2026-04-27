import type { Request, Response } from 'express'
import * as meModel from '../models/me.js'
import { getUserId } from '../middleware/auth.js'
import { logApiError } from '../utils/log.js'

const DEFAULT_USER_ID = 'current-user'

export async function getMember(req: Request, res: Response) {
  try {
    const userId = getUserId(req, '')
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const member = await meModel.getMemberForApi(userId)
    if (!member) {
      res.status(404).json({ error: 'Member not found' })
      return
    }
    res.json(member)
  } catch (e) {
    logApiError(e, 'me.getMember')
    res.status(500).json({ error: (e as Error).message })
  }
}

const AI_USAGE_MAX_DAYS = 90

export async function getAiUsage(req: Request, res: Response) {
  try {
    const userId = getUserId(req, '')
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }
    const daysRaw = req.query.days
    const parsed = Number(
      typeof daysRaw === 'string'
        ? daysRaw
        : Array.isArray(daysRaw)
          ? daysRaw[0]
          : ''
    )
    const days = Number.isFinite(parsed)
      ? Math.min(AI_USAGE_MAX_DAYS, Math.max(1, Math.floor(parsed)))
      : 30
    const shopParam = req.query.shopId
    const shopIdRaw =
      typeof shopParam === 'string'
        ? shopParam.trim()
        : Array.isArray(shopParam) && typeof shopParam[0] === 'string'
          ? shopParam[0].trim()
          : ''
    const shopId = shopIdRaw.length > 0 ? shopIdRaw : null
    const report = await meModel.getAiUsageReportForUser({
      userId,
      days,
      shopId,
    })
    res.json(report)
  } catch (e) {
    logApiError(e, 'me.getAiUsage')
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getNotifications(req: Request, res: Response) {
  try {
    const userId = getUserId(
      req,
      (req.headers['x-user-id'] as string) ?? DEFAULT_USER_ID
    )
    const first = req.query.first ? Number(req.query.first) : 50
    const notifications = await meModel.getNotifications(userId, first)
    const list = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.createdAt,
      actor: { id: n.actorId, name: n.actorName },
      targetUrl: n.targetUrl,
    }))
    res.json(list)
  } catch (e) {
    logApiError(e, 'me.getNotifications')
    res.status(500).json({ error: (e as Error).message })
  }
}
