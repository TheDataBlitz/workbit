import { generateId } from './store.js'
import type {
  Project,
  Member,
  Invitation,
  StatusUpdate,
  ProjectProperties,
} from './types.js'
import * as dbProjects from '../db/projects.js'
import * as dbStatusUpdates from '../db/statusUpdates.js'
import * as dbMembers from '../db/members.js'
import * as dbInvitations from '../db/invitations.js'
import * as dbProjectProperties from '../db/projectProperties.js'
import * as dbProjectAgents from '../db/projectAgents.js'

// Agents enabled by default for every new project.
// Keep this list small; users can enable/disable per project via /projects/:projectId/agents.
const DEFAULT_PROJECT_AGENT_KEYS = [
  'workbit_orchestrator',
  'workbit_mcp_analyzer',
] as const

export async function getProjects(): Promise<Project[]> {
  return dbProjects.getProjects()
}

export async function getMembers(): Promise<Member[]> {
  return dbMembers.getMembers()
}

export type ProjectListItemApi = {
  id: string
  name: string
  description: string
  workspaceId: string
  status: string
}

/** Status update node on GET /api/v1/projects/:projectId/status-updates. */
export type ProjectStatusUpdateNodeApi = {
  id: string
  status: string
  content: string
  author: { id: string; name: string; avatarSrc?: string }
  createdAt: string
  commentCount: number
}

function statusUpdateToProjectApiNode(
  u: StatusUpdate
): ProjectStatusUpdateNodeApi {
  return {
    id: u.id,
    status: u.status,
    content: u.content,
    author: {
      id: u.authorId,
      name: u.authorName,
      avatarSrc: u.authorAvatarSrc,
    },
    createdAt: u.createdAt,
    commentCount: u.commentCount,
  }
}

export async function getProjectsForApi(): Promise<ProjectListItemApi[]> {
  const projects = await dbProjects.getProjects()
  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    workspaceId: p.workspaceId,
    status: p.status,
  }))
}

/** Single project for GET /api/v1/projects/:projectId (metadata only). */
export async function getProjectByIdForApi(
  projectId: string
): Promise<ProjectListItemApi | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    workspaceId: project.workspaceId,
    status: project.status,
  }
}

/** Project properties for GET /api/v1/projects/:projectId/properties. */
export async function getProjectPropertiesForApi(
  projectId: string
): Promise<ProjectProperties | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  return await dbProjectProperties.getProjectPropertiesByTeamId(projectId)
}

/** Workspace id for a project (tenant key for AI usage / shop_id). */
export async function getWorkspaceIdForProject(
  projectId: string
): Promise<string | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  const wid = project.workspaceId?.trim()
  return wid && wid.length > 0 ? wid : null
}

/** Status updates for GET /api/v1/projects/:projectId/status-updates (20 most recent). */
export async function getProjectStatusUpdatesForApi(
  projectId: string
): Promise<{ nodes: ProjectStatusUpdateNodeApi[] } | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  const updates = await dbStatusUpdates.getStatusUpdatesByProjectId(
    projectId,
    20
  )
  return {
    nodes: updates.map(statusUpdateToProjectApiNode),
  }
}

export async function assignProjectLead(
  projectId: string,
  leadId: string | null
): Promise<ProjectProperties | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  const current = await dbProjectProperties.getProjectPropertiesByTeamId(
    projectId
  )
  const next: ProjectProperties = { ...current, leadId: leadId ?? undefined }
  await dbProjectProperties.upsertProjectProperties(projectId, next)
  return next
}

export type MemberListItemApi = {
  id: string
  name: string
  username: string
  avatarSrc?: string
  status: string
  joined: string
  provisioned: boolean
  uid: string | null
}

export async function getMembersForApi(): Promise<MemberListItemApi[]> {
  const members = await dbMembers.getMembers()
  return members.map((m) => {
    return {
      id: m.id,
      name: m.name,
      username: m.username,
      avatarSrc: m.avatarSrc,
      status: m.status,
      joined: m.joined,
      provisioned: m.provisioned ?? false,
      uid: m.uid ?? m.userAuthId ?? null,
    }
  })
}

export async function inviteMember(email: string): Promise<Invitation> {
  const inv: Invitation = {
    id: generateId(),
    email,
    createdAt: new Date().toISOString(),
  }
  await dbInvitations.insertInvitation(inv)
  return inv
}

export interface CreateMemberInput {
  name: string
  username: string
  status: string
  email?: string
  uid?: string | null
  userAuthId?: string | null
  provisioned?: boolean
}

export async function createMember(input: CreateMemberInput): Promise<Member> {
  const authId = input.uid ?? input.userAuthId ?? null
  const isProvisioned = input.provisioned ?? Boolean(authId)

  const member: Member = {
    id: generateId(),
    name: input.name,
    username: input.username,
    avatarSrc: undefined,
    status: input.status,
    joined: new Date().toISOString(),
    uid: authId,
    provisioned: isProvisioned,
    userAuthId: authId,
  }

  await dbMembers.insertMember(member)

  return member
}

export async function provisionMember(
  memberId: string,
  userAuthId: string
): Promise<Member> {
  const member = await dbMembers.getMemberById(memberId)
  if (!member) {
    throw new Error('Member not found')
  }

  if (member.provisioned && member.userAuthId === userAuthId) {
    return member
  }

  await dbMembers.updateMember(memberId, {
    provisioned: true,
    uid: userAuthId,
    userAuthId,
  })
  return { ...member, provisioned: true, uid: userAuthId, userAuthId }
}

export async function updateMemberForApi(
  memberId: string,
  patch: Partial<
    Pick<Member, 'name' | 'username' | 'avatarSrc' | 'status' | 'provisioned'>
  >
): Promise<MemberListItemApi> {
  const existing = await dbMembers.getMemberById(memberId)
  if (!existing) {
    throw new Error('Member not found')
  }

  const next: Partial<
    Pick<Member, 'name' | 'username' | 'avatarSrc' | 'status' | 'provisioned'>
  > = {}

  if (patch.name !== undefined) next.name = patch.name
  if (patch.username !== undefined) next.username = patch.username
  if (patch.avatarSrc !== undefined) next.avatarSrc = patch.avatarSrc
  if (patch.status !== undefined) next.status = patch.status
  if (patch.provisioned !== undefined) next.provisioned = patch.provisioned

  await dbMembers.updateMember(memberId, next)

  const updated = await dbMembers.getMemberById(memberId)
  if (!updated) {
    throw new Error('Member not found after update')
  }

  return {
    id: updated.id,
    name: updated.name,
    username: updated.username,
    avatarSrc: updated.avatarSrc,
    status: updated.status,
    joined: updated.joined,
    provisioned: updated.provisioned ?? false,
    uid: updated.uid ?? updated.userAuthId ?? null,
  }
}

export async function createProject(input: {
  name: string
  description?: string
  workspaceId: string
  status?: string
}): Promise<{ project: Project }> {
  const project: Project = {
    id: generateId(),
    name: input.name,
    description: input.description?.trim() ?? '',
    workspaceId: input.workspaceId,
    status: input.status ?? 'Active',
  }

  await dbProjects.insertProject(project)

  for (const k of DEFAULT_PROJECT_AGENT_KEYS) {
    await dbProjectAgents.addProjectAgent(project.id, k)
  }

  return { project }
}
