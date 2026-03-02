import { logbit } from '@thedatablitz/logbit-sdk'
import { LOGBIT_PROJECT_ID } from '../utils/errorHandling'
import { getAccessToken } from '../pages/auth/supabaseClient'

function getApiBase(): string {
  const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL
  if (typeof graphqlUrl === 'string' && graphqlUrl) {
    return `${new URL(graphqlUrl).origin}/api/v1`
  }
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
  startDate?: string
  endDate?: string
  [key: string]: unknown
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

/** Current user's member record (by auth token). Returns null if not found. */
export async function fetchMeMember(): Promise<ApiMember | null> {
  try {
    return (await authFetch('/me/member')) as ApiMember
  } catch (e) {
    logbit.warn('fetchMeMember failed (may be unauthenticated)', {
      projectId: LOGBIT_PROJECT_ID,
      title: 'fetchMeMember failed',
      error: e instanceof Error ? e.message : String(e),
    })
    return null
  }
}

export async function fetchProjects(): Promise<
  {
    id: string
    name: string
    team: { id: string; name: string }
    status: string
  }[]
> {
  return authFetch('/workspace/projects') as Promise<
    {
      id: string
      name: string
      team: { id: string; name: string }
      status: string
    }[]
  >
}

export async function createProject(body: {
  name: string
  teamId: string
  status?: string
}): Promise<{
  id: string
  name: string
  team: { id: string; name: string }
  status: string
}> {
  return authFetch('/workspace/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{
    id: string
    name: string
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

export async function fetchWorkspaceViews(): Promise<
  {
    id: string
    name: string
    type: string
    owner?: { id: string; name: string }
  }[]
> {
  return authFetch('/workspace/views') as Promise<
    {
      id: string
      name: string
      type: string
      owner?: { id: string; name: string }
    }[]
  >
}

export async function fetchRoles(): Promise<
  { id: string; role: string; memberCount: number; description: string }[]
> {
  return authFetch('/workspace/roles') as Promise<
    { id: string; role: string; memberCount: number; description: string }[]
  >
}

export async function inviteMember(
  email: string,
  roleId?: string
): Promise<unknown> {
  return authFetch('/workspace/members/invite', {
    method: 'POST',
    body: JSON.stringify({ email, roleId }),
  })
}

// --- Teams ---

export type ActivityIcon = 'milestone' | 'project'

export type TeamProjectResponse =
  | {
      team: { id: string; name: string }
      project: {
        id: string
        statusUpdates: { nodes: ApiStatusUpdate[] }
        properties: ApiProjectProperties
        milestones: {
          id: string
          name: string
          progress: number
          total: number
          targetDate: string
        }[]
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

export async function postStatusUpdate(
  teamId: string,
  content: string,
  status: ProjectStatus
): Promise<ApiStatusUpdate> {
  const raw = (await authFetch(`/teams/${teamId}/project/updates`, {
    method: 'POST',
    body: JSON.stringify({ content, status }),
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
  content: string
): Promise<{
  id: string
  authorName: string
  timestamp: string
  content: string
}> {
  return authFetch(`/teams/${teamId}/project/updates/${updateId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }) as Promise<{
    id: string
    authorName: string
    timestamp: string
    content: string
  }>
}

export async function createMilestone(
  teamId: string,
  body: { name: string; targetDate?: string; description?: string }
): Promise<{
  id: string
  name: string
  progress: number
  total: number
  targetDate: string
}> {
  return authFetch(`/teams/${teamId}/project/milestones`, {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{
    id: string
    name: string
    progress: number
    total: number
    targetDate: string
  }>
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

export async function fetchTeamViews(teamId: string): Promise<
  {
    id: string
    name: string
    type: string
    owner?: { id: string; name: string }
  }[]
> {
  return authFetch(`/teams/${teamId}/views`) as Promise<
    {
      id: string
      name: string
      type: string
      owner?: { id: string; name: string }
    }[]
  >
}

export interface ApiTeamLog {
  id: string
  action: string
  actor: { id: string; name: string }
  timestamp: string
  details: string
}

export interface ApiTeamLogsResponse {
  nodes: ApiTeamLog[]
}

export async function fetchTeamLogs(
  teamId: string,
  first?: number
): Promise<ApiTeamLogsResponse> {
  const q = first != null ? `?first=${first}` : ''
  return authFetch(`/teams/${teamId}/logs${q}`) as Promise<ApiTeamLogsResponse>
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
  }[]
> {
  return authFetch(`/teams/${teamId}/issues?filter=${filter}`) as Promise<
    {
      id: string
      title: string
      assignee: { id: string; name: string } | null
      date: string
      status: string
    }[]
  >
}

export async function createIssue(
  teamId: string | undefined,
  body: {
    title: string
    status?: string
    description?: string
    projectId?: string
  }
): Promise<ApiIssueDetail> {
  const payload: {
    title: string
    description?: string
    projectId?: string
    teamId?: string
    status?: string
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
  const url = teamId ? `/teams/${teamId}/issues` : '/issues'
  return authFetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<ApiIssueDetail>
}

// --- Me ---

export async function fetchMyIssues(): Promise<
  {
    id: string
    title: string
    assignee: { id: string; name: string } | null
    date: string
    status: string
    team: { id: string; name: string } | null
    project: { id: string; name: string } | null
  }[]
> {
  return authFetch('/me/issues') as Promise<
    {
      id: string
      title: string
      assignee: { id: string; name: string } | null
      date: string
      status: string
      team: { id: string; name: string } | null
      project: { id: string; name: string } | null
    }[]
  >
}

export async function fetchNotifications(): Promise<
  {
    id: string
    type: string
    title: string
    body: string
    read: boolean
    createdAt: string
    actor: { id: string; name: string }
    targetUrl?: string
  }[]
> {
  return authFetch('/me/notifications') as Promise<
    {
      id: string
      type: string
      title: string
      body: string
      read: boolean
      createdAt: string
      actor: { id: string; name: string }
      targetUrl?: string
    }[]
  >
}

// --- Issues ---

export async function fetchIssue(issueId: string): Promise<ApiIssueDetail> {
  return authFetch(`/issues/${issueId}`) as Promise<ApiIssueDetail>
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
