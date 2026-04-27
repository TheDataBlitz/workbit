import type { Request, Response } from 'express'
import * as workspaceModel from '../models/workspace.js'
import * as statusUpdatesModel from '../models/statusUpdates.js'
import * as projectAgentsModel from '../models/projectAgents.js'
import * as projectDocumentsModel from '../models/projectDocuments.js'
import * as dbAiTokenUsage from '../db/aiTokenUsage.js'
import { tokensToIntelebits } from '../models/aiUsage.js'
import { logApiError } from '../utils/log.js'

/** GET /api/v1/projects/:projectId */
export async function getProject(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const project = await workspaceModel.getProjectByIdForApi(projectId)
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json(project)
  } catch (e) {
    logApiError(e, 'projects.getProject', { projectId: req.params.projectId })
    res.status(500).json({ error: (e as Error).message })
  }
}

/** GET /api/v1/projects/:projectId/properties */
export async function getProjectProperties(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const props = await workspaceModel.getProjectPropertiesForApi(projectId)
    if (!props) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json({ properties: props })
  } catch (e) {
    logApiError(e, 'projects.getProjectProperties', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

/** GET /api/v1/projects/:projectId/status-updates */
export async function getProjectStatusUpdates(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const payload =
      await workspaceModel.getProjectStatusUpdatesForApi(projectId)
    if (!payload) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json(payload)
  } catch (e) {
    logApiError(e, 'projects.getProjectStatusUpdates', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

/** POST /api/v1/projects/:projectId/status-updates */
export async function postProjectStatusUpdate(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const { content, status, issueId } = req.body as {
      content?: string
      status?: string
      issueId?: string
    }
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'content is required' })
      return
    }
    const validStatus =
      status === 'at-risk' || status === 'off-track' ? status : 'on-track'
    const authorName = req.user?.email ?? 'You'
    const update = await statusUpdatesModel.addStatusUpdate({
      content,
      status: validStatus,
      author: { id: req.user?.id ?? 'current-user', name: authorName },
      projectId,
      issueId: issueId ?? null,
    })
    res.status(201).json(update)
  } catch (e) {
    logApiError(e, 'projects.postProjectStatusUpdate', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

/** POST /api/v1/projects/:projectId/lead — set project lead in project properties. */
export async function assignProjectLead(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const body = req.body as { leadId?: unknown }
    const leadIdRaw = typeof body.leadId === 'string' ? body.leadId.trim() : ''
    const leadId = leadIdRaw ? leadIdRaw : null

    const props = await workspaceModel.assignProjectLead(projectId, leadId)
    if (!props) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.status(200).json({ properties: props })
  } catch (e) {
    logApiError(e, 'projects.assignProjectLead', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

// ----------------------------
// Project agents
// ----------------------------

/** GET /api/v1/projects/:projectId/agents */
export async function listProjectAgents(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const data = await projectAgentsModel.listProjectAgentsForApi(projectId)
    if (!data) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.json({ agents: data })
  } catch (e) {
    logApiError(e, 'projectAgents.listProjectAgents', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

/** POST /api/v1/projects/:projectId/agents — body: { agentKey: string } */
export async function enableProjectAgent(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const body = req.body as { agentKey?: unknown }
    const agentKey =
      typeof body.agentKey === 'string' ? body.agentKey.trim() : ''
    if (!agentKey) {
      res.status(400).json({ error: 'agentKey is required' })
      return
    }

    const result = await projectAgentsModel.enableProjectAgent(projectId, agentKey)
    if (!result.ok) {
      if (result.error === 'project_not_found') {
        res.status(404).json({ error: 'Project not found' })
        return
      }
      res.status(400).json({ error: 'Unknown agentKey' })
      return
    }

    res.status(201).json({ ok: true, agentKey })
  } catch (e) {
    logApiError(e, 'projectAgents.enableProjectAgent', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

/** DELETE /api/v1/projects/:projectId/agents/:agentKey */
export async function disableProjectAgent(req: Request, res: Response) {
  try {
    const { projectId, agentKey } = req.params
    if (!agentKey?.trim()) {
      res.status(400).json({ error: 'agentKey is required' })
      return
    }

    const result = await projectAgentsModel.disableProjectAgent(
      projectId,
      decodeURIComponent(agentKey)
    )
    if (!result.ok) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    res.status(204).send()
  } catch (e) {
    logApiError(e, 'projectAgents.disableProjectAgent', {
      projectId: req.params.projectId,
      agentKey: req.params.agentKey,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

/** GET /api/v1/projects/:projectId/ai-usage?days=30 */
export async function getProjectAiUsage(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const project = await workspaceModel.getProjectByIdForApi(projectId)
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    const daysRaw = typeof req.query.days === 'string' ? req.query.days : ''
    const daysParsed = Number(daysRaw || 30)
    const days = Number.isFinite(daysParsed)
      ? Math.max(1, Math.min(365, Math.floor(daysParsed)))
      : 30

    const since = new Date()
    since.setUTCDate(since.getUTCDate() - days)
    since.setUTCHours(0, 0, 0, 0)

    const report = await dbAiTokenUsage.getAiTokenUsageReportForProject({
      projectId,
      since,
    })

    res.json({
      days,
      daily: report.daily,
      totals: {
        ...report.totals,
        intelebits: tokensToIntelebits(report.totals.tokens),
      },
    })
  } catch (e) {
    logApiError(e, 'projects.getProjectAiUsage', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

// ----------------------------
// Project documents
// ----------------------------

export async function listProjectDocuments(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const list = await projectDocumentsModel.listProjectDocumentsForApi(projectId)
    res.json(list)
  } catch (e) {
    const msg = (e as Error).message
    logApiError(e, 'projectDocuments.list', {
      projectId: req.params.projectId,
    })
    if (msg === 'Project not found') {
      res.status(404).json({ error: msg })
      return
    }
    res.status(500).json({ error: msg })
  }
}

export async function createProjectDocument(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const { title, content } = req.body as { title?: unknown; content?: unknown }
    if (typeof title !== 'string' || typeof content !== 'string') {
      res.status(400).json({ error: 'title and content are required' })
      return
    }
    const doc = await projectDocumentsModel.createProjectDocumentForApi({
      projectId,
      title,
      content,
      updatedBy: req.user?.email,
    })
    res.status(201).json(doc)
  } catch (e) {
    const msg = (e as Error).message
    logApiError(e, 'projectDocuments.create', {
      projectId: req.params.projectId,
    })
    if (msg === 'Project not found') {
      res.status(404).json({ error: msg })
      return
    }
    res.status(500).json({ error: msg })
  }
}

export async function getProjectDocument(req: Request, res: Response) {
  try {
    const { projectId, documentId } = req.params
    const doc = await projectDocumentsModel.getProjectDocumentForApi(
      projectId,
      documentId
    )
    res.json(doc)
  } catch (e) {
    const msg = (e as Error).message
    logApiError(e, 'projectDocuments.get', {
      projectId: req.params.projectId,
      documentId: req.params.documentId,
    })
    if (msg === 'Project not found' || msg === 'Document not found') {
      res.status(404).json({ error: msg })
      return
    }
    res.status(500).json({ error: msg })
  }
}

export async function patchProjectDocument(req: Request, res: Response) {
  try {
    const { projectId, documentId } = req.params
    const body = req.body as { title?: unknown; content?: unknown }
    if (body.title !== undefined && typeof body.title !== 'string') {
      res.status(400).json({ error: 'title must be a string' })
      return
    }
    if (body.content !== undefined && typeof body.content !== 'string') {
      res.status(400).json({ error: 'content must be a string' })
      return
    }
    const title = body.title === undefined ? undefined : body.title
    const content = body.content === undefined ? undefined : body.content
    if (title === undefined && content === undefined) {
      res
        .status(400)
        .json({ error: 'At least one of title or content is required' })
      return
    }
    const doc = await projectDocumentsModel.updateProjectDocumentForApi({
      projectId,
      documentId,
      title,
      content,
      updatedBy: req.user?.email,
    })
    res.json(doc)
  } catch (e) {
    const msg = (e as Error).message
    logApiError(e, 'projectDocuments.patch', {
      projectId: req.params.projectId,
      documentId: req.params.documentId,
    })
    if (msg === 'Project not found' || msg === 'Document not found') {
      res.status(404).json({ error: msg })
      return
    }
    res.status(500).json({ error: msg })
  }
}
