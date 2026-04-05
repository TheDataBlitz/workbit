import type { Request, Response } from 'express'
import * as projectAgentsModel from '../models/projectAgents.js'
import { logApiError } from '../utils/log.js'

/** GET /api/v1/agents/catalog — built-in agent definitions (no system prompt text). */
export function getAgentCatalog(_req: Request, res: Response) {
  try {
    const agents = projectAgentsModel
      .listFullCatalogForApi()
      .map(({ key, title, description }) => ({
        agentKey: key,
        title,
        description,
      }))
    res.json({ agents })
  } catch (e) {
    logApiError(e, 'projectAgents.getAgentCatalog')
    res.status(500).json({ error: (e as Error).message })
  }
}

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

    const result = await projectAgentsModel.enableProjectAgent(
      projectId,
      agentKey
    )
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
