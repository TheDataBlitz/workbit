import * as dbProjectAgents from '../db/projectAgents.js'
import * as dbProjects from '../db/projects.js'
import {
  getAgentCatalogEntry,
  isValidAgentKey,
  listAgentCatalog,
  type AgentCatalogEntry,
} from './agentCatalog.js'

export type ProjectAgentApiItem = {
  agentKey: string
  title: string
  description: string
  createdAt: string
}

export async function listProjectAgentsForApi(
  projectId: string
): Promise<ProjectAgentApiItem[] | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null

  await cleanupInvalidProjectAgents(projectId)

  const rows = await dbProjectAgents.listProjectAgents(projectId)
  const out: ProjectAgentApiItem[] = []
  for (const row of rows) {
    const def = getAgentCatalogEntry(row.agent_key)
    if (!def) continue
    out.push({
      agentKey: row.agent_key,
      title: def.title,
      description: def.description,
      createdAt: row.created_at,
    })
  }
  return out
}

export async function cleanupInvalidProjectAgents(
  projectId: string
): Promise<void> {
  const validKeys = listAgentCatalog().map((e) => e.key)
  await dbProjectAgents.removeProjectAgentsNotInKeys(projectId, validKeys)
}

export async function enableProjectAgent(
  projectId: string,
  agentKey: string
): Promise<
  { ok: true } | { ok: false; error: 'project_not_found' | 'invalid_agent_key' }
> {
  if (!isValidAgentKey(agentKey)) {
    return { ok: false, error: 'invalid_agent_key' }
  }
  const project = await dbProjects.getProjectById(projectId)
  if (!project) {
    return { ok: false, error: 'project_not_found' }
  }
  await dbProjectAgents.addProjectAgent(projectId, agentKey)
  return { ok: true }
}

export async function disableProjectAgent(
  projectId: string,
  agentKey: string
): Promise<{ ok: true } | { ok: false; error: 'project_not_found' }> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) {
    return { ok: false, error: 'project_not_found' }
  }
  await dbProjectAgents.removeProjectAgent(projectId, agentKey)
  return { ok: true }
}

/** Enabled keys for a project (catalog-valid only), sorted. */
export async function listEnabledAgentKeys(
  projectId: string
): Promise<string[]> {
  await cleanupInvalidProjectAgents(projectId)
  const rows = await dbProjectAgents.listProjectAgents(projectId)
  const keys = rows.map((r) => r.agent_key).filter((k) => isValidAgentKey(k))
  return [...new Set(keys)].sort()
}

export function catalogEntriesForKeys(keys: string[]): AgentCatalogEntry[] {
  const out: AgentCatalogEntry[] = []
  for (const k of keys) {
    const e = getAgentCatalogEntry(k)
    if (e) out.push(e)
  }
  return out
}

export function listFullCatalogForApi(): AgentCatalogEntry[] {
  return [...listAgentCatalog()]
}
