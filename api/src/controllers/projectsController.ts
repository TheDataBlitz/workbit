import type { Request, Response } from 'express'
import * as workspaceModel from '../models/workspace.js'
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

/** POST /api/v1/projects/:projectId/members/from-team — add team members to project properties. */
export async function addTeamMembersToProject(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const props = await workspaceModel.addTeamMembersToProject(projectId)
    if (!props) {
      res.status(404).json({ error: 'Project not found' })
      return
    }
    res.status(200).json({ properties: props })
  } catch (e) {
    logApiError(e, 'projects.addTeamMembersToProject', {
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
