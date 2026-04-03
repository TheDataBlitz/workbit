import { convertToLexicalJson } from '@thedatablitz/text-editor'

export interface WorkbitInitConfig {
  apiKey: string
  baseUrl?: string
}

export interface CreateIssueParams {
  title: string
  projectId: string
  description?: string
  parentIssueId?: string
}

export interface CreateProjectParams {
  name: string
  teamId: string
  description?: string
  status?: ProjectStatus
}

export interface CreatedProject {
  id: string
  name: string
  description?: string
  team: { id: string; name: string }
  status: string
}

export interface CreatedIssue {
  id: string
  title: string
  description?: string
  date: string
  status: string
  teamId: string
  projectId?: string
  parentIssueId?: string
  assignee?: { id: string; name: string } | null
  team?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
}

/** Matches GET /api/v1/issues/:issueId */
export interface IssueDetail {
  id: string
  title: string
  description?: string
  assignee?: { id: string; name: string } | null
  date: string
  status: string
  teamId: string | null
  team?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  parentIssueId?: string | null
}

/** Matches GET /api/v1/projects/:projectId — project metadata only. */
export interface ProjectSummary {
  id: string
  name: string
  description: string
  team: { id: string; name: string }
  status: string
}

/** Matches GET /api/v1/projects/:projectId/issues */
export interface IssueListItem {
  id: string
  title: string
  assignee: { id: string; name: string } | null
  date: string
  status: string
  parentIssueId: string | null
  subIssueCount: number
}

export type IssueListFilter = 'all' | 'active' | 'backlog'

export type ProjectStatus = 'on-track' | 'at-risk' | 'off-track'

/** Status update for a project — GET /api/v1/projects/:projectId/status-updates. */
export interface ProjectStatusUpdate {
  id: string
  status: ProjectStatus
  content: string
  author: { id: string; name: string; avatarSrc?: string }
  createdAt: string
  commentCount: number
}

export type TeamProjectActivityIcon = 'project'

export interface TeamProjectProperties {
  status?: string
  priority?: string
  startDate?: string
  endDate?: string
  [key: string]: unknown
}

/** Same payload as GET /api/v1/teams/:teamId/project (team project details page). */
export type TeamProjectResponse =
  | {
      team: { id: string; name: string }
      project: {
        id: string
        description: string
        statusUpdates: { nodes: ProjectStatusUpdate[] }
        properties: TeamProjectProperties
        activity: {
          id: string
          message: string
          date: string
          icon: TeamProjectActivityIcon
        }[]
      }
    }
  | {
      team: { id: string; name: string }
      project: null
    }

/** GET /api/v1/teams/:teamId/project/updates/:updateId/comments */
export interface StatusUpdateComment {
  id: string
  authorName: string
  authorAvatarSrc?: string
  content: string
  timestamp: string
  parentCommentId: string | null
}

export interface PostStatusUpdateCommentParams {
  content: string
  parentCommentId?: string | null
}

/** POST /api/v1/teams/:teamId/project/updates/:updateId/comments */
export interface PostStatusUpdateCommentResult {
  comments: StatusUpdateComment[]
}

let config: { apiKey: string; baseUrl: string } | null = null

const DEFAULT_BASE_URL = 'http://localhost:3001'

function lexicalJsonHasMeaningfulText(serialized: string): boolean {
  try {
    const parsed = JSON.parse(serialized) as {
      root?: { children?: unknown }
    }
    const children = parsed?.root?.children
    if (!Array.isArray(children)) return false

    const stack: unknown[] = [...children]
    while (stack.length > 0) {
      const node = stack.pop()
      if (!node || typeof node !== 'object') continue

      const anyNode = node as Record<string, unknown>
      const text = anyNode.text
      if (typeof text === 'string' && text.trim() !== '') return true

      const nested = anyNode.children
      if (Array.isArray(nested)) {
        for (const child of nested) stack.push(child)
      }
    }

    return false
  } catch {
    return false
  }
}

/**
 * Normalizes SDK `description` strings so the API always receives Lexical JSON.
 * - If `raw` is already Lexical JSON with non-empty `root.children`, returns as-is.
 * - Otherwise treats `raw` as markdown/plain text and converts to Lexical JSON.
 * - Returns `''` when there is no content (avoids invalid empty Lexical root objects).
 */
function toLexicalDescription(raw: string | null | undefined): string {
  const s = raw ?? ''
  if (!s.trim()) return ''

  try {
    const parsed = JSON.parse(s) as { root?: unknown }
    if (parsed && typeof parsed === 'object' && parsed.root != null) {
      return lexicalJsonHasMeaningfulText(s) ? s : ''
    }
  } catch {
    // not JSON — treat as markdown/plain text
  }

  try {
    const converted = convertToLexicalJson(s, 'markdown')
    return lexicalJsonHasMeaningfulText(converted) ? converted : ''
  } catch {
    return s
  }
}

function maybeLexicalDescription(
  raw: string | null | undefined
): string | undefined {
  if (raw == null) return undefined
  if (typeof raw === 'string' && raw.trim() === '') return undefined
  return toLexicalDescription(raw)
}

function requireConfig(): { apiKey: string; baseUrl: string } {
  if (!config) {
    throw new Error(
      'Workbit SDK not initialized. Call workbit.init({ apiKey, baseUrl? }) first.'
    )
  }
  return config
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const c = requireConfig()
  const url = `${c.baseUrl.replace(/\/$/, '')}${path}`
  const res = await fetch(url, {
    method: init?.method,
    body: init?.body,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': c.apiKey,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (data as { error?: string }).error ?? res.statusText
    throw new Error(msg)
  }
  return data as T
}

export const workbit = {
  init(cfg: WorkbitInitConfig): void {
    config = {
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl ?? DEFAULT_BASE_URL,
    }
  },

  async getIssue(issueId: string): Promise<IssueDetail> {
    return requestJson<IssueDetail>(
      `/api/v1/issues/${encodeURIComponent(issueId)}`
    )
  },

  async updateIssue(
    issueId: string,
    payload: {
      title?: string
      description?: string
      status?: string
      assigneeId?: string | null
    }
  ) {
    const normalizedPayload = {
      ...payload,
      description: maybeLexicalDescription(payload.description),
    }
    return requestJson<IssueDetail>(
      `/api/v1/issues/${encodeURIComponent(issueId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(normalizedPayload),
      }
    )
  },

  /** Project metadata — GET /api/v1/projects/:projectId */
  async getProject(projectId: string): Promise<ProjectSummary> {
    return requestJson<ProjectSummary>(
      `/api/v1/projects/${encodeURIComponent(projectId)}`
    )
  },

  async getIssuesByProject(
    projectId: string,
    filter: IssueListFilter = 'all'
  ): Promise<IssueListItem[]> {
    const q = new URLSearchParams({ filter })
    return requestJson<IssueListItem[]>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/issues?${q}`
    )
  },

  async issue(params: CreateIssueParams): Promise<CreatedIssue> {
    return requestJson<CreatedIssue>('/api/v1/issues', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        description: maybeLexicalDescription(params.description),
      }),
    })
  },

  async createProject(params: CreateProjectParams): Promise<CreatedProject> {
    return requestJson<CreatedProject>('/api/v1/workspace/projects', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        description: maybeLexicalDescription(params.description),
      }),
    })
  },

  /** Status updates for a project — GET /api/v1/projects/:projectId/status-updates */
  async statusUpdatesByProject(
    projectId: string
  ): Promise<ProjectStatusUpdate[]> {
    const body = await requestJson<{ nodes: ProjectStatusUpdate[] }>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/status-updates`
    )
    return body.nodes
  },

  /** All comments on a project status update. */
  async getProjectStatusUpdateComments(
    teamId: string,
    updateId: string
  ): Promise<StatusUpdateComment[]> {
    return requestJson<StatusUpdateComment[]>(
      `/api/v1/teams/${encodeURIComponent(teamId)}/project/updates/${encodeURIComponent(updateId)}/comments`
    )
  },

  /** Create a comment on a project status update (may return multiple entries if an AI reply is appended). */
  async postProjectStatusUpdateComment(
    teamId: string,
    updateId: string,
    params: PostStatusUpdateCommentParams
  ): Promise<PostStatusUpdateCommentResult> {
    const body: { content: string; parentCommentId?: string | null } = {
      content: params.content,
    }
    if (params.parentCommentId !== undefined) {
      body.parentCommentId = params.parentCommentId
    }
    return requestJson<PostStatusUpdateCommentResult>(
      `/api/v1/teams/${encodeURIComponent(teamId)}/project/updates/${encodeURIComponent(updateId)}/comments`,
      { method: 'POST', body: JSON.stringify(body) }
    )
  },
}
