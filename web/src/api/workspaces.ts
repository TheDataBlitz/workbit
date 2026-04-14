import { authFetch } from './client'
import type { ApiWorkspace } from '../types/workspace'

export async function fetchWorkspaces(
  memberId: string
): Promise<ApiWorkspace[]> {
  return authFetch<ApiWorkspace[]>(
    `/workspaces?memberId=${encodeURIComponent(memberId)}`
  )
}
