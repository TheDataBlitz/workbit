import { authFetch } from './client'

export type ApiProjectSummary = {
  id: string
  name: string
  description: string
  team: { id: string; name: string }
  status: string
}

export type ApiProjectStatusUpdateNode = {
  id: string
  status: string
  content: string
  author: { id: string; name: string; avatarSrc?: string }
  createdAt: string
  commentCount: number
}

export type ApiProjectStatusUpdates = { nodes: ApiProjectStatusUpdateNode[] }

export type ApiDecisionType = 'major' | 'minor'
export type ApiDecisionStatus =
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'superseded'

export type ApiDecision = {
  id: string
  projectId: string
  title: string
  type: ApiDecisionType
  rationale: string
  impact?: string
  tags: string[]
  createdBy: { id: string; name: string }
  decisionDate?: string
  status: ApiDecisionStatus
  linkedIssueIds: string[]
  createdAt: string
  updatedAt: string
}

export type ApiDecisionListResponse = {
  items: ApiDecision[]
  pagination: { page: number; pageSize: number; total: number }
}

export type ApiProjectIssueListItem = {
  id: string
  title: string
  assignee: { id: string; name: string } | null
  date: string
  status: string
  parentIssueId: string | null
  subIssueCount: number
}

export async function fetchProject(
  projectId: string
): Promise<ApiProjectSummary> {
  return authFetch<ApiProjectSummary>(
    `/projects/${encodeURIComponent(projectId)}`
  )
}

export async function fetchProjectStatusUpdates(
  projectId: string
): Promise<ApiProjectStatusUpdates> {
  return authFetch<ApiProjectStatusUpdates>(
    `/projects/${encodeURIComponent(projectId)}/status-updates`
  )
}

export async function fetchProjectDecisions(
  projectId: string
): Promise<ApiDecisionListResponse> {
  return authFetch<ApiDecisionListResponse>(
    `/projects/${encodeURIComponent(projectId)}/decisions`
  )
}

export async function fetchProjectIssues(
  projectId: string,
  filter: 'all' | 'active' | 'backlog' = 'all'
): Promise<ApiProjectIssueListItem[]> {
  return authFetch<ApiProjectIssueListItem[]>(
    `/projects/${encodeURIComponent(projectId)}/issues?filter=${encodeURIComponent(filter)}`
  )
}
