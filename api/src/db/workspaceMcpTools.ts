import { getClient } from './client.js'

export type WorkspaceMcpToolRow = {
  id: string
  workspaceId: string
  toolKey: string
  enabled: boolean
  baseUrl: string | null
  accessToken: string | null
  createdAt: string
  updatedAt: string
}

type DbRow = {
  id: string
  workspace_id: string
  tool_key: string
  enabled: boolean
  base_url: string | null
  access_token: string | null
  created_at: string
  updated_at: string
}

function rowToApi(r: DbRow): WorkspaceMcpToolRow {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    toolKey: r.tool_key,
    enabled: Boolean(r.enabled),
    baseUrl: r.base_url ?? null,
    accessToken: r.access_token ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function listWorkspaceMcpTools(
  workspaceId: string
): Promise<WorkspaceMcpToolRow[]> {
  const { data, error } = await getClient()
    .from('workspace_mcp_tools')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('tool_key')
  if (error) throw error
  return (data ?? []).map((r) => rowToApi(r as DbRow))
}

export async function listEnabledWorkspaceMcpTools(
  workspaceId: string
): Promise<WorkspaceMcpToolRow[]> {
  const { data, error } = await getClient()
    .from('workspace_mcp_tools')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('enabled', true)
    .order('tool_key')
  if (error) throw error
  return (data ?? []).map((r) => rowToApi(r as DbRow))
}

export async function upsertWorkspaceMcpTool(input: {
  workspaceId: string
  toolKey: string
  enabled: boolean
  baseUrl: string | null
  accessToken: string | null
}): Promise<WorkspaceMcpToolRow> {
  const nowIso = new Date().toISOString()
  const payload = {
    workspace_id: input.workspaceId,
    tool_key: input.toolKey,
    enabled: input.enabled,
    base_url: input.baseUrl,
    access_token: input.accessToken,
    updated_at: nowIso,
  }
  const { data, error } = await getClient()
    .from('workspace_mcp_tools')
    .upsert(payload as never, {
      onConflict: 'workspace_id,tool_key',
    })
    .select('*')
    .single()
  if (error) throw error
  return rowToApi(data as DbRow)
}
