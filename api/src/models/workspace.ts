import { generateId } from './store.js'
import type {
  Project,
  Team,
  Member,
  Invitation,
  StatusUpdate,
  ProjectProperties,
} from './types.js'
import * as dbProjects from '../db/projects.js'
import * as dbTeams from '../db/teams.js'
import * as dbStatusUpdates from '../db/statusUpdates.js'
import * as dbMembers from '../db/members.js'
import * as dbInvitations from '../db/invitations.js'
import * as dbProjectProperties from '../db/projectProperties.js'
import { insertTeam } from '../db/teams.js'

export async function getProjects(): Promise<Project[]> {
  return dbProjects.getProjects()
}

export async function getTeams(): Promise<Team[]> {
  return dbTeams.getTeams()
}

export async function getMembers(): Promise<Member[]> {
  return dbMembers.getMembers()
}

export type ProjectListItemApi = {
  id: string
  name: string
  description: string
  team: { id: string; name: string }
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
  const [projects, teams] = await Promise.all([
    dbProjects.getProjects(),
    dbTeams.getTeams(),
  ])
  const teamsById = new Map(teams.map((t) => [t.id, t]))
  return projects.map((p) => {
    const team = teamsById.get(p.teamId)
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      team: team
        ? { id: team.id, name: team.name }
        : { id: p.teamId, name: p.teamId },
      status: p.status,
    }
  })
}

/** Single project for GET /api/v1/projects/:projectId (metadata only). */
export async function getProjectByIdForApi(
  projectId: string
): Promise<ProjectListItemApi | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  const team = await dbTeams.getTeamById(project.teamId)
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    team: team
      ? { id: team.id, name: team.name }
      : { id: project.teamId, name: project.teamId },
    status: project.status,
  }
}

/** Workspace id for a project (tenant key for AI usage / shop_id). */
export async function getWorkspaceIdForProject(
  projectId: string
): Promise<string | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  const team = await dbTeams.getTeamById(project.teamId)
  const wid = team?.workspaceId?.trim()
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

export async function addTeamMembersToProject(
  projectId: string
): Promise<ProjectProperties | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  const team = await dbTeams.getTeamById(project.teamId)
  if (!team) return null

  const current = await dbProjectProperties.getProjectPropertiesByTeamId(
    team.id
  )
  const teamMemberIds = team.memberIds ?? []
  const mergedMemberIds = [
    ...new Set([...(current.memberIds ?? []), ...teamMemberIds]),
  ]

  const next: ProjectProperties = { ...current, memberIds: mergedMemberIds }
  await dbProjectProperties.upsertProjectProperties(team.id, next)
  return next
}

export async function assignProjectLead(
  projectId: string,
  leadId: string | null
): Promise<ProjectProperties | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project) return null
  const team = await dbTeams.getTeamById(project.teamId)
  if (!team) return null

  const current = await dbProjectProperties.getProjectPropertiesByTeamId(
    team.id
  )
  const next: ProjectProperties = { ...current, leadId: leadId ?? undefined }
  await dbProjectProperties.upsertProjectProperties(team.id, next)
  return next
}

export type TeamListItemApi = {
  id: string
  name: string
  memberCount: number
  project: { id: string; name: string } | null
}

export async function getTeamsForApi(
  workspaceId: string,
  memberId?: string
): Promise<TeamListItemApi[]> {
  const [teams, projects] = await Promise.all([
    dbTeams.getTeamsByWorkspace(workspaceId, memberId),
    dbProjects.getProjects(),
  ])
  const projectsById = new Map(projects.map((p) => [p.id, p]))
  return teams.map((t) => {
    const project = t.projectId ? projectsById.get(t.projectId) : undefined
    return {
      id: t.id,
      name: t.name,
      memberCount: t.memberIds?.length ?? 0,
      project: project ? { id: project.id, name: project.name } : null,
    }
  })
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
  teams: string
}

export async function getMembersForApi(): Promise<MemberListItemApi[]> {
  const [members, teams] = await Promise.all([
    dbMembers.getMembers(),
    dbTeams.getTeams(),
  ])
  const teamsById = new Map(teams.map((t) => [t.id, t.name]))
  return members.map((m) => {
    const teamNames = m.teamIds
      .map((tid) => teamsById.get(tid))
      .filter(Boolean) as string[]
    return {
      id: m.id,
      name: m.name,
      username: m.username,
      avatarSrc: m.avatarSrc,
      status: m.status,
      joined: m.joined,
      provisioned: m.provisioned ?? false,
      uid: m.uid ?? m.userAuthId ?? null,
      teams: teamNames.length ? teamNames.join(', ') : '—',
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
  teamIds?: string[]
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
    teamIds: input.teamIds ?? [],
    uid: authId,
    provisioned: isProvisioned,
    userAuthId: authId,
  }

  await dbMembers.insertMember(member)

  if (member.teamIds.length > 0) {
    const teams = await dbTeams.getTeams()
    const teamsById = new Map(teams.map((t) => [t.id, t]))
    for (const teamId of member.teamIds) {
      const team = teamsById.get(teamId)
      if (team && !team.memberIds.includes(member.id)) {
        await dbTeams.updateTeam(teamId, {
          memberIds: [...team.memberIds, member.id],
        })
      }
    }
  }

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

export async function createTeam(input: {
  workspaceId: string
  name: string
}): Promise<Team> {
  const team: Team = {
    id: generateId(),
    name: input.name,
    workspaceId: input.workspaceId,
    memberIds: [],
  }
  await insertTeam(team)
  return team
}

export async function createProject(input: {
  name: string
  description?: string
  teamId: string
  status?: string
}): Promise<{ project: Project; team: Team }> {
  const team = await dbTeams.getTeamById(input.teamId)
  if (!team) {
    throw new Error('Team not found')
  }

  const project: Project = {
    id: generateId(),
    name: input.name,
    description: input.description?.trim() ?? '',
    teamId: input.teamId,
    status: input.status ?? 'Active',
  }

  await dbProjects.insertProject(project)
  await dbTeams.updateTeam(input.teamId, { projectId: project.id })

  return { project, team }
}
