/**
 * Map between Supabase rows (snake_case) and domain entities (camelCase).
 * Row-to-entity mappers are used by db/ modules; storeToRows is used by supabaseStore (seeding only).
 */
import type {
  Store,
  Workspace,
  Project,
  Team,
  Member,
  Role,
  Invitation,
  StatusUpdate,
  ProjectProperties,
  ProjectDocument,
  ProjectDocumentSummary,
  ActivityItem,
  Issue,
  Decision,
  DecisionType,
  DecisionStatus,
  Notification,
  ProjectStatus,
  ActivityIcon,
} from '../models/types.js'

export type DbRow = Record<string, unknown>

export function rowToWorkspace(r: DbRow): Workspace {
  return {
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    region: (r.region as string) ?? 'us',
    memberIds: (r.member_ids as string[]) ?? [],
  }
}

export function rowToProject(r: DbRow): Project {
  return {
    id: r.id as string,
    name: r.name as string,
    description: (r.description as string) ?? '',
    teamId: r.team_id as string,
    status: r.status as string,
  }
}

export function rowToTeam(r: DbRow): Team {
  return {
    id: r.id as string,
    name: r.name as string,
    workspaceId: (r.workspace_id as string) ?? '',
    projectId: r.project_id as string | undefined,
    memberIds: (r.member_ids as string[]) ?? [],
  }
}

export function rowToMember(r: DbRow): Member {
  const authId = (r.supabase_user_id as string | null | undefined) ?? null
  return {
    id: r.id as string,
    name: r.name as string,
    username: r.username as string,
    avatarSrc: r.avatar_src as string | undefined,
    status: r.status as string,
    joined: r.joined as string,
    teamIds: (r.team_ids as string[]) ?? [],
    provisioned: (r.provisioned as boolean) ?? false,
    uid: authId,
    userAuthId: authId,
  }
}

export function rowToRole(r: DbRow): Role {
  return {
    id: r.id as string,
    role: r.role as string,
    memberCount: (r.member_count as number) ?? 0,
    description: (r.description as string) ?? '',
  }
}

export function rowToInvitation(r: DbRow): Invitation {
  return {
    id: r.id as string,
    email: r.email as string,
    roleId: r.role_id as string | undefined,
    createdAt: r.created_at as string,
  }
}

export function rowToStatusUpdate(r: DbRow): StatusUpdate {
  return {
    id: r.id as string,
    teamId: (r.team_id as string | null) ?? null,
    status: r.status as ProjectStatus,
    content: r.content as string,
    authorId: r.author_id as string,
    authorName: r.author_name as string,
    authorAvatarSrc: r.author_avatar_src as string | undefined,
    createdAt: r.created_at as string,
    commentCount: (r.comment_count as number) ?? 0,
    projectId: (r.project_id as string | undefined) ?? null,
    issueId: (r.issue_id as string | undefined) ?? null,
  }
}

export function rowToProjectProperties(r: DbRow): ProjectProperties {
  return {
    status: r.status as string,
    priority: r.priority as string,
    leadId: r.lead_id as string | undefined,
    startDate: r.start_date as string | undefined,
    endDate: r.end_date as string | undefined,
    memberIds: (r.member_ids as string[]) ?? [],
    teamIds: (r.team_ids as string[]) ?? [],
    labelIds: (r.label_ids as string[]) ?? [],
  }
}

export function rowToProjectDocument(r: DbRow): ProjectDocument {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    title: (r.title as string) ?? '',
    content: (r.content as string) ?? '',
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
    updatedBy: (r.updated_by as string | null | undefined) ?? undefined,
  }
}

export function rowToProjectDocumentSummary(r: DbRow): ProjectDocumentSummary {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    title: (r.title as string) ?? '',
    updatedAt: r.updated_at as string,
    updatedBy: (r.updated_by as string | null | undefined) ?? undefined,
  }
}

export function rowToActivity(r: DbRow): ActivityItem {
  return {
    id: r.id as string,
    teamId: r.team_id as string,
    icon: r.icon as ActivityIcon,
    message: r.message as string,
    date: r.date as string,
  }
}

export function rowToIssue(r: DbRow): Issue {
  return {
    id: r.id as string,
    title: r.title as string,
    assigneeId: r.assignee_id as string | undefined,
    assigneeName: r.assignee_name as string | undefined,
    date: r.date as string,
    status: r.status as string,
    teamId: (r.team_id as string) || undefined,
    projectId: r.project_id as string | undefined,
    description: r.description as string | undefined,
    parentIssueId:
      (r.parent_issue_id as string | null | undefined) ?? undefined,
  }
}

export function rowToDecision(r: DbRow): Decision {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    title: r.title as string,
    type: r.type as DecisionType,
    rationale: r.rationale as string,
    impact: (r.impact as string | null | undefined) ?? undefined,
    tags: (r.tags as string[]) ?? [],
    createdBy: {
      id: r.created_by_id as string,
      name: r.created_by_name as string,
    },
    decisionDate:
      (r.decision_date as string | null | undefined) === null
        ? undefined
        : ((r.decision_date as string | undefined) ?? undefined),
    status: r.status as DecisionStatus,
    linkedIssueIds: (r.linked_issue_ids as string[]) ?? [],
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  }
}

export function issueToRow(i: Issue): Record<string, unknown> {
  return {
    id: i.id,
    title: i.title,
    assignee_id: i.assigneeId ?? null,
    assignee_name: i.assigneeName ?? null,
    date: i.date,
    status: i.status,
    team_id: i.teamId ?? null,
    project_id: i.projectId ?? null,
    description: i.description ?? null,
    parent_issue_id: i.parentIssueId ?? null,
  }
}

export function decisionToRow(d: Decision): Record<string, unknown> {
  return {
    id: d.id,
    project_id: d.projectId,
    title: d.title,
    type: d.type,
    rationale: d.rationale,
    impact: d.impact ?? null,
    tags: d.tags ?? [],
    created_by_id: d.createdBy.id,
    created_by_name: d.createdBy.name,
    decision_date: d.decisionDate ?? null,
    status: d.status,
    linked_issue_ids: d.linkedIssueIds ?? [],
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  }
}

function workspaceToRow(w: Workspace): Record<string, unknown> {
  return {
    id: w.id,
    name: w.name,
    slug: w.slug,
    region: w.region,
    member_ids: w.memberIds ?? [],
  }
}

function projectToRow(p: Project): Record<string, unknown> {
  return { id: p.id, name: p.name, team_id: p.teamId, status: p.status }
}

function teamToRow(t: Team): Record<string, unknown> {
  return {
    id: t.id,
    name: t.name,
    workspace_id: t.workspaceId ?? null,
    project_id: t.projectId ?? null,
    member_ids: t.memberIds ?? [],
  }
}

function memberToRow(m: Member): Record<string, unknown> {
  return {
    id: m.id,
    name: m.name,
    username: m.username,
    avatar_src: m.avatarSrc ?? null,
    status: m.status,
    joined: m.joined,
    team_ids: m.teamIds ?? [],
    provisioned: m.provisioned ?? false,
    supabase_user_id: m.uid ?? m.userAuthId ?? null,
  }
}

function roleToRow(r: Role): Record<string, unknown> {
  return {
    id: r.id,
    role: r.role,
    member_count: r.memberCount,
    description: r.description,
  }
}

function invitationToRow(i: Invitation): Record<string, unknown> {
  return {
    id: i.id,
    email: i.email,
    role_id: i.roleId ?? null,
    created_at: i.createdAt,
  }
}

function statusUpdateToRow(u: StatusUpdate): Record<string, unknown> {
  return {
    id: u.id,
    team_id: u.teamId ?? null,
    status: u.status,
    content: u.content,
    author_id: u.authorId,
    author_name: u.authorName,
    author_avatar_src: u.authorAvatarSrc ?? null,
    created_at: u.createdAt,
    comment_count: u.commentCount ?? 0,
    project_id: u.projectId ?? null,
    issue_id: u.issueId ?? null,
  }
}

function projectPropertiesToRow(
  teamId: string,
  p: ProjectProperties
): Record<string, unknown> {
  return {
    team_id: teamId,
    status: p.status,
    priority: p.priority,
    lead_id: p.leadId ?? null,
    start_date: p.startDate ?? null,
    end_date: p.endDate ?? null,
    member_ids: p.memberIds ?? [],
    team_ids: p.teamIds ?? [],
    label_ids: p.labelIds ?? [],
  }
}

function activityToRow(a: ActivityItem): Record<string, unknown> {
  return {
    id: a.id,
    team_id: a.teamId,
    icon: a.icon,
    message: a.message,
    date: a.date,
  }
}

function notificationToRow(n: Notification): Record<string, unknown> {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    created_at: n.createdAt,
    actor_id: n.actorId,
    actor_name: n.actorName,
    target_url: n.targetUrl ?? null,
  }
}

export function rowToNotification(r: DbRow): Notification {
  return {
    id: r.id as string,
    type: r.type as string,
    title: r.title as string,
    body: r.body as string,
    read: (r.read as boolean) ?? false,
    createdAt: r.created_at as string,
    actorId: r.actor_id as string,
    actorName: r.actor_name as string,
    targetUrl: r.target_url as string | undefined,
  }
}

export function storeToRows(store: Store) {
  return {
    workspaces: store.workspaces.map((w) => workspaceToRow(w)),
    projects: store.projects.map((p) => projectToRow(p)),
    teams: store.teams.map((t) => teamToRow(t)),
    members: store.members.map((m) => memberToRow(m)),
    roles: store.roles.map((r) => roleToRow(r)),
    invitations: store.invitations.map((i) => invitationToRow(i)),
    status_updates: store.statusUpdates.map((u) => statusUpdateToRow(u)),
    project_properties: Object.entries(store.projectPropertiesByTeam ?? {}).map(
      ([teamId, p]) => projectPropertiesToRow(teamId, p)
    ),
    activity: store.activity.map((a) => activityToRow(a)),
    issues: store.issues.map((i) => issueToRow(i)),
    decisions: store.decisions.map((d) => decisionToRow(d)),
    notifications: store.notifications.map((n) => notificationToRow(n)),
  }
}
