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
    logApiError(e, 'agents.getAgentCatalog')
    res.status(500).json({ error: (e as Error).message })
  }
}

