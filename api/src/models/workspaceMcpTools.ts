import * as db from '../db/workspaceMcpTools.js'

export type WorkspaceMcpTool = db.WorkspaceMcpToolRow

export async function listWorkspaceMcpTools(
  workspaceId: string
): Promise<WorkspaceMcpTool[]> {
  return db.listWorkspaceMcpTools(workspaceId)
}

export async function listEnabledWorkspaceMcpTools(
  workspaceId: string
): Promise<WorkspaceMcpTool[]> {
  return db.listEnabledWorkspaceMcpTools(workspaceId)
}

export async function setWorkspaceMcpTool(input: {
  workspaceId: string
  toolKey: string
  enabled: boolean
  baseUrl: string | null
  accessToken: string | null
}): Promise<WorkspaceMcpTool> {
  return db.upsertWorkspaceMcpTool(input)
}
