import { authFetch } from './client'

export type ApiWorkspaceProject = {
  id: string
  name: string
  description: string
  workspaceId: string
  status: string
}

export type ApiWorkspaceMember = {
  id: string
  name: string
  username: string
  avatarSrc?: string
  status: string
  joined: string
  provisioned: boolean
  uid: string | null
}

export async function fetchWorkspaceProjects(): Promise<ApiWorkspaceProject[]> {
  return authFetch<ApiWorkspaceProject[]>('/workspace/projects')
}

export async function fetchWorkspaceMembers(): Promise<ApiWorkspaceMember[]> {
  return authFetch<ApiWorkspaceMember[]>('/workspace/members')
}
