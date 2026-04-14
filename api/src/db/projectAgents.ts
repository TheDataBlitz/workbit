import { getClient } from './client.js'

export type ProjectAgentRow = {
  project_id: string
  agent_key: string
  created_at: string
}

export async function listProjectAgents(
  projectId: string
): Promise<ProjectAgentRow[]> {
  const { data, error } = await getClient()
    .from('project_agents')
    .select('project_id, agent_key, created_at')
    .eq('project_id', projectId)
    .order('agent_key')
  if (error) throw error
  return (data ?? []) as ProjectAgentRow[]
}

export async function addProjectAgent(
  projectId: string,
  agentKey: string
): Promise<void> {
  const { error } = await getClient()
    .from('project_agents')
    .upsert({ project_id: projectId, agent_key: agentKey } as never, {
      onConflict: 'project_id,agent_key',
    })
  if (error) throw error
}

export async function removeProjectAgent(
  projectId: string,
  agentKey: string
): Promise<void> {
  const { error } = await getClient()
    .from('project_agents')
    .delete()
    .eq('project_id', projectId)
    .eq('agent_key', agentKey)
  if (error) throw error
}

export async function removeProjectAgentsNotInKeys(
  projectId: string,
  validAgentKeys: string[]
): Promise<void> {
  if (!projectId?.trim()) return
  if (!validAgentKeys.length) return
  const inList = `(${validAgentKeys
    .map((k) => `"${k.replaceAll('"', '\\"')}"`)
    .join(',')})`
  const { error } = await getClient()
    .from('project_agents')
    .delete()
    .eq('project_id', projectId)
    .not('agent_key', 'in', inList)
  if (error) throw error
}
