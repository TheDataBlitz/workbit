import { logbit } from '@thedatablitz/logbit-sdk'
import { LOGBIT_PROJECT_ID } from '../utils/errorHandling'
import { getAccessToken } from '../pages/auth/supabaseClient'

function getApiBase(): string {
  const apiUrl = import.meta.env.VITE_API_URL
  if (typeof apiUrl === 'string' && apiUrl) {
    const base = apiUrl.replace(/\/$/, '')
    return `${base}/api/v1`
  }
  return '/api/v1'
}

const API_BASE = getApiBase()

/**
 * Authenticated fetch for REST API. Uses session token when available.
 */
export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  const token = await getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = (err as { error?: string }).error || res.statusText
    logbit.error('API request failed', {
      projectId: LOGBIT_PROJECT_ID,
      title: 'API request failed',
      path,
      status: res.status,
      error: message,
    })
    throw new Error(message)
  }
  if (res.status === 204) return null
  return res.json()
}

// --- Types (used by components) ---

export interface ApiWorkspace {
  id: string
  name: string
  slug: string
  region: string
}

export interface ApiMember {
  id: string
  name: string
  username: string
  avatarSrc?: string
  status: string
  joined: string
  provisioned: boolean
  uid?: string | null
  teams: string
}

export interface ApiIssueDetail {
  id: string
  title: string
  description?: string
  assignee?: { id: string; name: string } | null
  date: string
  status: string
  teamId: string
  team?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  parentIssueId?: string | null
}

export interface ApiSubIssue {
  id: string
  title: string
  status: string
  date: string
}

export interface ApiGeneratedSubIssue {
  title: string
  description?: string
}

export type ProjectStatus = 'on-track' | 'at-risk' | 'off-track'

export interface ApiStatusUpdate {
  id: string
  status: ProjectStatus
  content: string
  author: { id: string; name: string; avatarSrc?: string }
  createdAt: string
  commentCount: number
}

export interface ApiProjectProperties {
  status?: string
  priority?: string
  leadId?: string
  startDate?: string
  endDate?: string
  memberIds?: string[]
  teamIds?: string[]
  labelIds?: string[]
  [key: string]: unknown
}

export interface ApiProjectDocumentSummary {
  id: string
  projectId: string
  title: string
  updatedAt: string | null
  updatedBy: string | null
}

export interface ApiProjectDocument extends ApiProjectDocumentSummary {
  content: string
  createdAt: string | null
}

export type ApiDecisionType = 'major' | 'minor'
export type ApiDecisionStatus =
  | 'proposed'
  | 'approved'
  | 'rejected'
  | 'superseded'

export interface ApiDecision {
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

export interface ApiDecisionListResponse {
  items: ApiDecision[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

/** GET /me/ai-usage — your AI token usage (aggregated from ai_token_usage). */
export interface ApiMeAiUsageDaily {
  date: string
  tokens: number
}

export interface ApiMeAiUsageByShop {
  shopId: string
  requests: number
  tokens: number
}

/** Workspace month-to-date vs monthly Intelebit cap (from GET /me/ai-usage / POST /ai). */
export interface ApiMeAiUsageMonthlyBudget {
  capIntelebits: number
  usedIntelebits: number
  usagePercent: number
}

export interface ApiMeAiUsageReport {
  days: number
  daily: ApiMeAiUsageDaily[]
  totals: { requests: number; tokens: number; intelebits: number }
  byShop: ApiMeAiUsageByShop[]
  monthlyBudget: ApiMeAiUsageMonthlyBudget | null
}

export async function fetchMeAiUsage(params: {
  days: number
  shopId?: string | null
}): Promise<ApiMeAiUsageReport> {
  const sp = new URLSearchParams()
  sp.set('days', String(params.days))
  if (params.shopId?.trim()) {
    sp.set('shopId', params.shopId.trim())
  }
  return authFetch(
    `/me/ai-usage?${sp.toString()}`
  ) as Promise<ApiMeAiUsageReport>
}

// --- Workspaces ---

export async function fetchWorkspaces(
  memberId: string
): Promise<ApiWorkspace[]> {
  return authFetch(
    `/workspaces?memberId=${encodeURIComponent(memberId)}`
  ) as Promise<ApiWorkspace[]>
}

export async function createWorkspace(body: {
  name: string
  slug: string
  region: string
  memberId: string
}): Promise<ApiWorkspace> {
  return authFetch('/workspaces', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<ApiWorkspace>
}

// --- Workspace MCP tools (IntegrationBits) ---

export type ApiWorkspaceMcpToolCatalogItem = {
  toolKey: string
  name: string
  description: string
  enabled: boolean
  baseUrl: string | null
  hasToken: boolean
}

export async function fetchWorkspaceMcpTools(
  workspaceId: string
): Promise<{ tools: ApiWorkspaceMcpToolCatalogItem[] }> {
  return authFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/mcp-tools`
  ) as Promise<{ tools: ApiWorkspaceMcpToolCatalogItem[] }>
}

export async function setWorkspaceMcpTool(
  workspaceId: string,
  toolKey: string,
  body: { enabled: boolean; baseUrl?: string; token?: string }
): Promise<{
  toolKey: string
  enabled: boolean
  baseUrl: string | null
  hasToken: boolean
}> {
  return authFetch(
    `/workspaces/${encodeURIComponent(workspaceId)}/mcp-tools/${encodeURIComponent(toolKey)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    }
  ) as Promise<{
    toolKey: string
    enabled: boolean
    baseUrl: string | null
    hasToken: boolean
  }>
}

// --- Workspace (singular: current workspace scope) ---

export async function fetchMembers(): Promise<ApiMember[]> {
  return authFetch('/workspace/members') as Promise<ApiMember[]>
}

export async function createMember(body: {
  name: string
  username: string
  email: string
  status?: string
  teamIds?: string[]
}): Promise<ApiMember> {
  return authFetch('/workspace/members', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<ApiMember>
}

export async function fetchProjects(): Promise<
  {
    id: string
    name: string
    description: string
    team: { id: string; name: string }
    status: string
  }[]
> {
  return authFetch('/workspace/projects') as Promise<
    {
      id: string
      name: string
      description: string
      team: { id: string; name: string }
      status: string
    }[]
  >
}

export async function createProject(body: {
  name: string
  description?: string
  teamId: string
  status?: string
}): Promise<{
  id: string
  name: string
  description: string
  team: { id: string; name: string }
  status: string
}> {
  return authFetch('/workspace/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{
    id: string
    name: string
    description: string
    team: { id: string; name: string }
    status: string
  }>
}

export async function fetchWorkspaceTeams(
  workspaceId: string,
  memberId?: string
): Promise<
  {
    id: string
    name: string
    memberCount: number
    project: { id: string; name: string } | null
  }[]
> {
  const params = new URLSearchParams({ workspaceId })
  if (memberId != null && memberId !== '') params.set('memberId', memberId)
  return authFetch(`/workspace/teams?${params.toString()}`) as Promise<
    {
      id: string
      name: string
      memberCount: number
      project: { id: string; name: string } | null
    }[]
  >
}

export async function createTeam(body: {
  workspaceId: string
  name: string
}): Promise<{
  id: string
  name: string
  memberCount: number
  project: { id: string; name: string } | null
}> {
  return authFetch('/workspace/teams', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{
    id: string
    name: string
    memberCount: number
    project: { id: string; name: string } | null
  }>
}

// --- Teams ---

export type ActivityIcon = 'project'

export type TeamProjectResponse =
  | {
      team: { id: string; name: string }
      project: {
        id: string
        description: string
        statusUpdates: { nodes: ApiStatusUpdate[] }
        properties: ApiProjectProperties
        activity: {
          id: string
          message: string
          date: string
          icon: ActivityIcon
        }[]
      }
    }
  | {
      team: { id: string; name: string }
      project: null
    }

export async function fetchTeamProject(
  teamId: string
): Promise<TeamProjectResponse> {
  return authFetch(`/teams/${teamId}/project`) as Promise<TeamProjectResponse>
}

export interface ApiTeamMember {
  id: string
  name: string
  username: string
  avatarSrc?: string
}

export type ApiTeam = {
  id: string
  name: string
  memberCount: number
  project: { id: string; name: string } | null
}

export async function fetchTeamMembers(
  teamId: string
): Promise<ApiTeamMember[]> {
  return authFetch(`/teams/${teamId}/members`) as Promise<ApiTeamMember[]>
}

export async function postStatusUpdate(
  teamId: string,
  content: string,
  status: ProjectStatus,
  options?: { projectId?: string; issueId?: string }
): Promise<ApiStatusUpdate> {
  const body: {
    content: string
    status: string
    projectId?: string
    issueId?: string
  } = { content, status }
  if (options?.projectId) body.projectId = options.projectId
  if (options?.issueId) body.issueId = options.issueId
  const raw = (await authFetch(`/teams/${teamId}/project/updates`, {
    method: 'POST',
    body: JSON.stringify(body),
  })) as {
    id: string
    status: string
    content: string
    authorId: string
    authorName: string
    authorAvatarSrc?: string
    createdAt: string
    commentCount: number
  }
  return {
    id: raw.id,
    status: raw.status as ProjectStatus,
    content: raw.content,
    createdAt: raw.createdAt,
    commentCount: raw.commentCount,
    author: {
      id: raw.authorId,
      name: raw.authorName,
      avatarSrc: raw.authorAvatarSrc,
    },
  }
}

export async function postComment(
  teamId: string,
  updateId: string,
  content: string,
  options?: { parentCommentId?: string | null }
): Promise<{
  comments: Array<{
    id: string
    authorName: string
    authorAvatarSrc?: string
    timestamp: string
    content: string
    parentCommentId: string | null
  }>
}> {
  const body =
    options === undefined
      ? { content }
      : { content, parentCommentId: options.parentCommentId ?? null }
  return authFetch(`/teams/${teamId}/project/updates/${updateId}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{
    comments: Array<{
      id: string
      authorName: string
      authorAvatarSrc?: string
      timestamp: string
      content: string
      parentCommentId: string | null
    }>
  }>
}

export async function fetchStatusUpdateComments(
  teamId: string,
  updateId: string
): Promise<
  {
    id: string
    authorName: string
    authorAvatarSrc?: string
    timestamp: string
    content: string
    parentCommentId: string | null
  }[]
> {
  return authFetch(
    `/teams/${teamId}/project/updates/${updateId}/comments`
  ) as Promise<
    {
      id: string
      authorName: string
      authorAvatarSrc?: string
      timestamp: string
      content: string
      parentCommentId: string | null
    }[]
  >
}

export async function patchProject(
  teamId: string,
  body: { status?: string; priority?: string; [key: string]: unknown }
): Promise<ApiProjectProperties> {
  return authFetch(`/teams/${teamId}/project`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<ApiProjectProperties>
}

// --- Team issues ---

export async function fetchTeamIssues(
  teamId: string,
  filter: 'all' | 'active' | 'backlog' = 'all'
): Promise<
  {
    id: string
    title: string
    assignee: { id: string; name: string } | null
    date: string
    status: string
    parentIssueId: string | null
    subIssueCount: number
  }[]
> {
  return authFetch(`/teams/${teamId}/issues?filter=${filter}`) as Promise<
    {
      id: string
      title: string
      assignee: { id: string; name: string } | null
      date: string
      status: string
      parentIssueId: string | null
      subIssueCount: number
    }[]
  >
}

export async function fetchTeamProjectIssues(
  teamId: string,
  filter: 'all' | 'active' | 'backlog' = 'all',
  projectId?: string
): Promise<
  {
    id: string
    title: string
    assignee: { id: string; name: string } | null
    date: string
    status: string
    parentIssueId: string | null
    subIssueCount: number
  }[]
> {
  const params = new URLSearchParams({ filter })
  if (projectId && projectId.trim() !== '')
    params.set('projectId', projectId.trim())
  return authFetch(
    `/teams/${teamId}/project/issues?${params.toString()}`
  ) as Promise<
    {
      id: string
      title: string
      assignee: { id: string; name: string } | null
      date: string
      status: string
      parentIssueId: string | null
      subIssueCount: number
    }[]
  >
}

/** GET /projects/:projectId — project metadata only. */
export interface ApiProjectSummary {
  id: string
  name: string
  description: string
  team: { id: string; name: string }
  status: string
}

export async function fetchProject(
  projectId: string
): Promise<ApiProjectSummary> {
  return authFetch(
    `/projects/${encodeURIComponent(projectId)}`
  ) as Promise<ApiProjectSummary>
}

export async function fetchProjectDecisions(
  projectId: string,
  options?: {
    type?: ApiDecisionType
    status?: ApiDecisionStatus
    fromDate?: string
    toDate?: string
    mode?: 'sequential' | 'mixed'
    order?: 'asc' | 'desc'
    page?: number
    pageSize?: number
  }
): Promise<ApiDecisionListResponse> {
  const params = new URLSearchParams()
  if (options?.type) params.set('type', options.type)
  if (options?.status) params.set('status', options.status)
  if (options?.fromDate) params.set('fromDate', options.fromDate)
  if (options?.toDate) params.set('toDate', options.toDate)
  if (options?.mode) params.set('mode', options.mode)
  if (options?.order) params.set('order', options.order)
  if (options?.page) params.set('page', String(options.page))
  if (options?.pageSize) params.set('pageSize', String(options.pageSize))

  const query = params.toString()
  return authFetch(
    `/projects/${projectId}/decisions${query ? `?${query}` : ''}`
  ) as Promise<ApiDecisionListResponse>
}

export async function createProjectDecision(
  projectId: string,
  body: {
    title: string
    type: ApiDecisionType
    rationale: string
    impact?: string
    tags?: string[]
    createdBy?: { id?: string; name?: string }
    decisionDate?: string
    status?: ApiDecisionStatus
    linkedIssueIds?: string[]
  }
): Promise<ApiDecision> {
  return authFetch(`/projects/${projectId}/decisions`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<ApiDecision>
}

export async function updateProjectDecision(
  projectId: string,
  decisionId: string,
  body: {
    title?: string
    type?: ApiDecisionType
    rationale?: string
    impact?: string
    tags?: string[]
    decisionDate?: string
    status?: ApiDecisionStatus
    linkedIssueIds?: string[]
  }
): Promise<ApiDecision> {
  return authFetch(`/projects/${projectId}/decisions/${decisionId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<ApiDecision>
}

export async function fetchProjectDocuments(
  projectId: string
): Promise<ApiProjectDocumentSummary[]> {
  return authFetch(`/projects/${projectId}/documents`) as Promise<
    ApiProjectDocumentSummary[]
  >
}

export async function createProjectDocument(
  projectId: string,
  body: { title: string; content: string }
): Promise<ApiProjectDocument> {
  return authFetch(`/projects/${projectId}/documents`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<ApiProjectDocument>
}

export async function fetchProjectDocument(
  projectId: string,
  documentId: string
): Promise<ApiProjectDocument> {
  return authFetch(
    `/projects/${projectId}/documents/${documentId}`
  ) as Promise<ApiProjectDocument>
}

export async function updateProjectDocument(
  projectId: string,
  documentId: string,
  body: { title?: string; content?: string }
): Promise<ApiProjectDocument> {
  return authFetch(`/projects/${projectId}/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<ApiProjectDocument>
}

export async function createIssue(
  teamId: string | undefined,
  body: {
    title: string
    status?: string
    description?: string
    projectId?: string
    parentIssueId?: string
  }
): Promise<ApiIssueDetail> {
  const payload: {
    title: string
    description?: string
    projectId?: string
    teamId?: string
    status?: string
    parentIssueId?: string
  } = {
    title: body.title,
    description: body.description,
    status: body.status,
  }
  if (body.projectId != null && body.projectId !== '') {
    payload.projectId = body.projectId
  }
  if (teamId) {
    payload.teamId = teamId
  }
  if (body.parentIssueId != null && body.parentIssueId !== '') {
    payload.parentIssueId = body.parentIssueId
  }
  const url = teamId ? `/teams/${teamId}/issues` : '/issues'
  return authFetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<ApiIssueDetail>
}

// --- Issues ---

export async function fetchIssue(issueId: string): Promise<ApiIssueDetail> {
  return authFetch(`/issues/${issueId}`) as Promise<ApiIssueDetail>
}

export async function fetchSubIssues(issueId: string): Promise<ApiSubIssue[]> {
  return authFetch(`/issues/${issueId}/sub-issues`) as Promise<ApiSubIssue[]>
}

export async function generateSubIssues(
  issueId: string
): Promise<{ issueId: string; subIssues: ApiGeneratedSubIssue[] }> {
  return authFetch(`/issues/${issueId}/sub-issues/generate`, {
    method: 'POST',
  }) as Promise<{ issueId: string; subIssues: ApiGeneratedSubIssue[] }>
}

export type ApiIssueComment = {
  id: string
  entityId: string
  authorName: string
  authorAvatarSrc?: string
  content: string
  createdAt: string
  parentCommentId: string | null
  likes: number
  mentionAuthorIds: string[]
  commentOptions: { hideReplies: boolean; hideLikes: boolean }
}

export async function fetchIssueComments(
  issueId: string
): Promise<ApiIssueComment[]> {
  return authFetch(`/issues/${issueId}/comments`) as Promise<ApiIssueComment[]>
}

export async function postIssueComment(
  issueId: string,
  content: string,
  options?: { parentCommentId?: string | null }
): Promise<ApiIssueComment> {
  const body =
    options === undefined
      ? { content }
      : { content, parentCommentId: options.parentCommentId ?? null }
  return authFetch(`/issues/${issueId}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<ApiIssueComment>
}

export async function updateIssue(
  issueId: string,
  body: {
    status?: string
    assigneeId?: string
    assigneeName?: string
    projectId?: string | null
    description?: string
  }
): Promise<ApiIssueDetail> {
  return authFetch(`/issues/${issueId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }) as Promise<ApiIssueDetail>
}

// --- Project AI agents ---

export type ApiAgentCatalogItem = {
  agentKey: string
  title: string
  description: string
}

export async function fetchAgentCatalog(): Promise<{
  agents: ApiAgentCatalogItem[]
}> {
  return authFetch('/agents/catalog') as Promise<{
    agents: ApiAgentCatalogItem[]
  }>
}

export type ApiProjectEnabledAgent = {
  agentKey: string
  title: string
  description: string
  createdAt: string
}

export async function fetchProjectEnabledAgents(
  projectId: string
): Promise<{ agents: ApiProjectEnabledAgent[] }> {
  return authFetch(
    `/projects/${encodeURIComponent(projectId)}/agents`
  ) as Promise<{ agents: ApiProjectEnabledAgent[] }>
}

export async function enableProjectAgentForProject(
  projectId: string,
  agentKey: string
): Promise<{ ok: true; agentKey: string }> {
  return authFetch(`/projects/${encodeURIComponent(projectId)}/agents`, {
    method: 'POST',
    body: JSON.stringify({ agentKey }),
  }) as Promise<{ ok: true; agentKey: string }>
}

export async function disableProjectAgentForProject(
  projectId: string,
  agentKey: string
): Promise<void> {
  await authFetch(
    `/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(agentKey)}`,
    { method: 'DELETE' }
  )
}
