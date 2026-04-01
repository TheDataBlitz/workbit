// Workspace entities

export interface Workspace {
  id: string
  name: string
  slug: string
  region: string
  memberIds: string[]
}

export interface Project {
  id: string
  name: string
  description: string
  teamId: string
  status: string
}

export interface Team {
  id: string
  name: string
  workspaceId: string
  projectId?: string
  memberIds: string[]
}

export interface Member {
  id: string
  name: string
  username: string
  avatarSrc?: string
  status: string
  joined: string
  teamIds: string[]
  /**
   * Supabase auth user id this member is linked to, if any.
   * Alias of userAuthId; kept for clearer semantics with Supabase auth.users.
   */
  uid?: string | null
  /**
   * Whether this member has been provisioned into Supabase auth
   * and is fully connected to a Supabase user account.
   */
  provisioned: boolean
  /**
   * Supabase auth user id this member is linked to, if any.
   */
  userAuthId?: string | null
}

export interface Invitation {
  id: string
  email: string
  createdAt: string
}

// Project status (team project)
export type ProjectStatus = 'on-track' | 'at-risk' | 'off-track'

export interface StatusUpdate {
  id: string
  teamId: string | null
  status: ProjectStatus
  content: string
  authorId: string
  authorName: string
  authorAvatarSrc?: string
  createdAt: string
  commentCount: number
  projectId?: string | null
  issueId?: string | null
}

export interface StatusUpdateComment {
  id: string
  updateId: string
  authorName: string
  authorAvatarSrc?: string
  content: string
  timestamp: string
  parentCommentId: string | null
}

export interface IssueComment {
  id: string
  /** Stored as `comments.entity_id` (e.g. issue id). */
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

export interface ProjectProperties {
  status: string
  priority: string
  leadId?: string
  startDate?: string
  endDate?: string
  memberIds: string[]
  teamIds: string[]
  labelIds: string[]
}

export interface ProjectDocument {
  id: string
  projectId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  updatedBy?: string
}

/** List row without full body content. */
export interface ProjectDocumentSummary {
  id: string
  projectId: string
  title: string
  updatedAt: string
  updatedBy?: string
}

export type ActivityIcon = 'project'

export interface ActivityItem {
  id: string
  teamId: string
  icon: ActivityIcon
  message: string
  date: string
}

// Issues
export interface Issue {
  id: string
  title: string
  assigneeId?: string
  assigneeName?: string
  date: string
  status: string
  teamId?: string
  projectId?: string
  description?: string
  parentIssueId?: string
}

// Project decisions
export type DecisionType = 'major' | 'minor'
export type DecisionStatus = 'proposed' | 'approved' | 'rejected' | 'superseded'

export interface Decision {
  id: string
  projectId: string
  title: string
  type: DecisionType
  rationale: string
  impact?: string
  tags: string[]
  createdBy: { id: string; name: string }
  decisionDate?: string
  status: DecisionStatus
  linkedIssueIds: string[]
  createdAt: string
  updatedAt: string
}

// Notifications
export interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
  actorId: string
  actorName: string
  targetUrl?: string
}

// Store shape (file or Supabase tables)
export interface Store {
  workspaces: Workspace[]
  projects: Project[]
  teams: Team[]
  members: Member[]
  invitations: Invitation[]
  statusUpdates: StatusUpdate[]
  projectPropertiesByTeam: Record<string, ProjectProperties>
  activity: ActivityItem[]
  issues: Issue[]
  decisions: Decision[]
  notifications: Notification[]
}

export const EMPTY_STORE: Store = {
  workspaces: [],
  projects: [],
  teams: [],
  members: [],
  invitations: [],
  statusUpdates: [],
  projectPropertiesByTeam: {},
  activity: [],
  issues: [],
  decisions: [],
  notifications: [],
}
