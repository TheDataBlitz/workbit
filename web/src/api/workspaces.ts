import { authFetch } from './client'
import type { ApiWorkspace } from '../types/workspace'

export async function fetchWorkspaces(
  memberId: string
): Promise<ApiWorkspace[]> {
  return authFetch<ApiWorkspace[]>(
    `/workspaces?memberId=${encodeURIComponent(memberId)}`
  )
}

export type ApiWorkspaceMcpTool = {
  toolKey: string
  name: string
  description: string
  enabled: boolean
  baseUrl: string | null
  hasToken: boolean
}

export async function fetchWorkspaceMcpTools(
  workspaceId: string
): Promise<ApiWorkspaceMcpTool[]> {
  const res = await authFetch<{ tools: ApiWorkspaceMcpTool[] }>(
    `/workspaces/${encodeURIComponent(workspaceId)}/mcp-tools`
  )
  return res.tools
}

export async function setWorkspaceMcpTool(input: {
  workspaceId: string
  toolKey: string
  enabled: boolean
  baseUrl?: string | null
  token?: string | null
}): Promise<{
  toolKey: string
  enabled: boolean
  baseUrl: string | null
  hasToken: boolean
  updatedAt: string
}> {
  return authFetch(
    `/workspaces/${encodeURIComponent(input.workspaceId)}/mcp-tools/${encodeURIComponent(input.toolKey)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        enabled: input.enabled,
        baseUrl: input.baseUrl ?? undefined,
        token: input.token ?? undefined,
      }),
    }
  )
}
