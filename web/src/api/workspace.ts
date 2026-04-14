import { authFetch } from './client'

export type ApiWorkspaceProject = {
  id: string
  name: string
  description: string
  team: { id: string; name: string }
  status: string
}

export async function fetchWorkspaceProjects(): Promise<ApiWorkspaceProject[]> {
  return authFetch<ApiWorkspaceProject[]>('/workspace/projects')
}
