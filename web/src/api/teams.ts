import { authFetch } from './client'

export type ApiWorkspaceTeam = {
  id: string
  name: string
  memberCount: number
  project: { id: string; name: string } | null
}

export type ApiTeamMember = {
  id: string
  name: string
  username: string
  avatarSrc?: string
}

export async function fetchWorkspaceTeams(params: {
  workspaceId: string
  memberId?: string | null
}): Promise<ApiWorkspaceTeam[]> {
  const sp = new URLSearchParams({ workspaceId: params.workspaceId })
  if (params.memberId?.trim()) sp.set('memberId', params.memberId.trim())
  return authFetch<ApiWorkspaceTeam[]>(`/workspace/teams?${sp.toString()}`)
}

export async function fetchTeamMembers(
  teamId: string
): Promise<ApiTeamMember[]> {
  return authFetch<ApiTeamMember[]>(
    `/teams/${encodeURIComponent(teamId)}/members`
  )
}
