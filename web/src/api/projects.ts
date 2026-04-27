import { authFetch } from './client'

export type ApiProjectSummary = {
  id: string
  name: string
  description: string
  workspaceId: string
  status: string
}

export type ApiProjectProperties = {
  status: string
  priority: string
  leadId?: string
  startDate?: string
  endDate?: string
  memberIds: string[]
  labelIds: string[]
}

export type ApiAgentCatalogItem = {
  agentKey: string
  title: string
  description: string
}

export type ApiProjectEnabledAgent = {
  agentKey: string
  title: string
  description: string
  createdAt: string
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

export type ApiProjectAiUsageDaily = {
  date: string
  tokens: number
  promptTokens: number
  completionTokens: number
}

export type ApiProjectAiUsageReport = {
  days: number
  daily: ApiProjectAiUsageDaily[]
  totals: {
    requests: number
    tokens: number
    promptTokens: number
    completionTokens: number
    intelebits: number
  }
}

export async function fetchProject(
  projectId: string
): Promise<ApiProjectSummary> {
  return authFetch<ApiProjectSummary>(
    `/projects/${encodeURIComponent(projectId)}`
  )
}

export async function fetchProjectProperties(
  projectId: string
): Promise<ApiProjectProperties> {
  const res = await authFetch<{ properties: ApiProjectProperties }>(
    `/projects/${encodeURIComponent(projectId)}/properties`
  )
  return res.properties
}

export async function fetchAgentCatalog(): Promise<ApiAgentCatalogItem[]> {
  const res = await authFetch<{ agents: ApiAgentCatalogItem[] }>(
    `/agents/catalog`
  )
  return res.agents
}

export async function fetchProjectEnabledAgents(
  projectId: string
): Promise<ApiProjectEnabledAgent[]> {
  const res = await authFetch<{ agents: ApiProjectEnabledAgent[] }>(
    `/projects/${encodeURIComponent(projectId)}/agents`
  )
  return res.agents
}

export async function setProjectAgentEnabled(input: {
  projectId: string
  agentKey: string
  enabled: boolean
}): Promise<void> {
  const { projectId, agentKey, enabled } = input
  if (enabled) {
    await authFetch(`/projects/${encodeURIComponent(projectId)}/agents`, {
      method: 'POST',
      body: JSON.stringify({ agentKey }),
    })
    return
  }
  await authFetch(
    `/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(agentKey)}`,
    { method: 'DELETE' }
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

export async function fetchProjectAiUsage(input: {
  projectId: string
  days?: number
}): Promise<ApiProjectAiUsageReport> {
  const days = typeof input.days === 'number' ? input.days : 30
  return authFetch<ApiProjectAiUsageReport>(
    `/projects/${encodeURIComponent(input.projectId)}/ai-usage?days=${encodeURIComponent(
      String(days)
    )}`
  )
}
