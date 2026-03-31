import type { Request, Response } from 'express'
import * as decisionsModel from '../models/decisions.js'
import { logApiError } from '../utils/log.js'

function parseMode(value: unknown): 'sequential' | 'mixed' {
  return value === 'sequential' ? 'sequential' : 'mixed'
}

function parseOrder(value: unknown): 'asc' | 'desc' {
  return value === 'asc' ? 'asc' : 'desc'
}

function parseType(value: unknown): 'major' | 'minor' | undefined {
  if (value === 'major' || value === 'minor') return value
  return undefined
}

function parseStatus(
  value: unknown
): 'proposed' | 'approved' | 'rejected' | 'superseded' | undefined {
  if (
    value === 'proposed' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'superseded'
  ) {
    return value
  }
  return undefined
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback
}

export async function listProjectDecisions(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const data = await decisionsModel.listDecisionsForApi({
      projectId,
      type: parseType(req.query.type),
      status: parseStatus(req.query.status),
      fromDate:
        typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined,
      toDate:
        typeof req.query.toDate === 'string' ? req.query.toDate : undefined,
      mode: parseMode(req.query.mode),
      order: parseOrder(req.query.order),
      page: parsePositiveInt(req.query.page, 1),
      pageSize: parsePositiveInt(req.query.pageSize, 20),
    })

    res.json(data)
  } catch (e) {
    logApiError(e, 'decisions.listProjectDecisions', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function createProjectDecision(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const body = req.body as {
      title?: string
      type?: 'major' | 'minor'
      rationale?: string
      impact?: string
      tags?: string[]
      createdBy?: { id?: string; name?: string }
      decisionDate?: string
      status?: 'proposed' | 'approved' | 'rejected' | 'superseded'
      linkedIssueIds?: string[]
    }

    if (!body.title || body.title.trim() === '') {
      res.status(400).json({ error: 'title is required' })
      return
    }

    if (!body.rationale || body.rationale.trim() === '') {
      res.status(400).json({ error: 'rationale is required' })
      return
    }

    const type = parseType(body.type)
    if (!type) {
      res.status(400).json({ error: "type must be 'major' or 'minor'" })
      return
    }

    const created = await decisionsModel.createDecisionForApi({
      projectId,
      title: body.title,
      type,
      rationale: body.rationale,
      impact: body.impact,
      tags: body.tags,
      createdBy: body.createdBy,
      decisionDate: body.decisionDate,
      status: parseStatus(body.status),
      linkedIssueIds: body.linkedIssueIds,
    })

    res.status(201).json(created)
  } catch (e) {
    const message = (e as Error).message
    logApiError(e, 'decisions.createProjectDecision', {
      projectId: req.params.projectId,
    })

    if (message.startsWith('Project not found:')) {
      res.status(404).json({ error: message })
      return
    }

    res.status(500).json({ error: message })
  }
}

export async function updateProjectDecision(req: Request, res: Response) {
  try {
    const { projectId, decisionId } = req.params
    const body = req.body as {
      title?: string
      type?: 'major' | 'minor'
      rationale?: string
      impact?: string
      tags?: string[]
      decisionDate?: string
      status?: 'proposed' | 'approved' | 'rejected' | 'superseded'
      linkedIssueIds?: string[]
    }

    const updated = await decisionsModel.updateDecisionForApi(
      projectId,
      decisionId,
      {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.rationale !== undefined && { rationale: body.rationale }),
        ...(body.impact !== undefined && { impact: body.impact }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.decisionDate !== undefined && {
          decisionDate: body.decisionDate,
        }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.linkedIssueIds !== undefined && {
          linkedIssueIds: body.linkedIssueIds,
        }),
      }
    )

    if (!updated) {
      res.status(404).json({ error: 'Decision not found' })
      return
    }

    res.json(updated)
  } catch (e) {
    logApiError(e, 'decisions.updateProjectDecision', {
      projectId: req.params.projectId,
      decisionId: req.params.decisionId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function deleteProjectDecision(req: Request, res: Response) {
  try {
    const { projectId, decisionId } = req.params
    const removed = await decisionsModel.deleteDecisionForApi(
      projectId,
      decisionId
    )

    if (!removed) {
      res.status(404).json({ error: 'Decision not found' })
      return
    }

    res.status(204).send()
  } catch (e) {
    logApiError(e, 'decisions.deleteProjectDecision', {
      projectId: req.params.projectId,
      decisionId: req.params.decisionId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}
