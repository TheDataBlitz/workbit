import { generateId } from './store.js'
import type {
  Team,
  StatusUpdate,
  StatusUpdateComment,
  ProjectProperties,
} from './types.js'
import * as dbTeams from '../db/teams.js'
import * as dbStatusUpdates from '../db/statusUpdates.js'
import * as dbIssueComments from '../db/issueComments.js'
import * as dbProjectProperties from '../db/projectProperties.js'
import * as dbActivity from '../db/activity.js'
import * as dbProjects from '../db/projects.js'
import * as dbMembers from '../db/members.js'

export async function getTeamById(teamId: string): Promise<Team | null> {
  return dbTeams.getTeamById(teamId)
}

export type TeamMemberListItemApi = {
  id: string
  name: string
  username: string
  avatarSrc?: string
}

export async function getTeamMembersForApi(
  teamId: string
): Promise<TeamMemberListItemApi[] | null> {
  const team = await dbTeams.getTeamById(teamId)
  if (!team) return null
  const members = await dbMembers.getMembersByTeamId(teamId)
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    username: member.username,
    avatarSrc: member.avatarSrc,
  }))
}

/** Returns the project if it exists and belongs to the given team. */
export async function getProjectByIdIfBelongsToTeam(
  projectId: string,
  teamId: string
): Promise<{
  id: string
  name: string
  teamId: string
  status: string
} | null> {
  const project = await dbProjects.getProjectById(projectId)
  if (!project || project.teamId !== teamId) return null
  return project
}

export async function getTeamProject(teamId: string) {
  const team = await dbTeams.getTeamById(teamId)
  if (!team) return null
  if (team.projectId == null || team.projectId === '') {
    return {
      team: { id: team.id, name: team.name },
      project: null,
    }
  }
  const [project, updates, properties, activity] = await Promise.all([
    dbProjects.getProjectById(team.projectId),
    dbStatusUpdates.getStatusUpdatesByProjectId(team.projectId, 20),
    dbProjectProperties.getProjectPropertiesByTeamId(teamId),
    dbActivity.getActivityByTeamId(teamId),
  ])
  const sortedActivity = [...activity].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return {
    team: { id: team.id, name: team.name },
    project: {
      id: team.projectId,
      description: project?.description ?? '',
      statusUpdates: { nodes: updates },
      properties,
      activity: sortedActivity,
    },
  }
}

export async function getStatusUpdateComments(
  updateId: string
): Promise<StatusUpdateComment[]> {
  const comments = await dbIssueComments.getIssueCommentsByIssueId(updateId)
  return comments.map((c) => ({
    id: c.id,
    updateId: c.entityId,
    authorName: c.authorName,
    authorAvatarSrc: c.authorAvatarSrc,
    content: c.content,
    timestamp: c.createdAt,
    parentCommentId: c.parentCommentId,
  }))
}

export async function getStatusUpdatesByIssueId(
  issueId: string,
  limit = 20
): Promise<StatusUpdate[]> {
  return dbStatusUpdates.getStatusUpdatesByIssueId(issueId, limit)
}

export async function addStatusUpdate(
  teamId: string | null,
  content: string,
  status: 'on-track' | 'at-risk' | 'off-track',
  author: { id: string; name: string; avatarSrc?: string },
  options?: {
    projectId?: string | null
    issueId?: string | null
  }
): Promise<StatusUpdate> {
  const update: StatusUpdate = {
    id: generateId(),
    teamId: teamId ?? null,
    status,
    content,
    authorId: author.id,
    authorName: author.name,
    authorAvatarSrc: author.avatarSrc,
    createdAt: new Date().toISOString(),
    commentCount: 0,
    projectId: options?.projectId ?? null,
    issueId: options?.issueId ?? null,
  }
  await dbStatusUpdates.insertStatusUpdate(update)
  return update
}

export async function addStatusUpdateComment(
  teamId: string,
  updateId: string,
  content: string,
  authorName: string,
  authorAvatarSrc?: string,
  options?: { parentCommentId?: string | null }
): Promise<StatusUpdateComment> {
  const update = await dbStatusUpdates.getStatusUpdateById(updateId)
  if (!update || update.teamId !== teamId) throw new Error('Update not found')
  const parentCommentId = options?.parentCommentId ?? null
  if (parentCommentId) {
    const parent = await dbIssueComments.getIssueCommentById(parentCommentId)
    if (!parent || parent.entityId !== updateId) {
      throw new Error('Parent comment not found')
    }
  }
  const comment: StatusUpdateComment = {
    id: generateId(),
    updateId,
    authorName,
    authorAvatarSrc,
    content,
    timestamp: new Date().toISOString(),
    parentCommentId,
  }
  await dbIssueComments.insertIssueComment({
    id: comment.id,
    entityId: comment.updateId,
    authorName: comment.authorName,
    authorAvatarSrc: comment.authorAvatarSrc,
    content: comment.content,
    createdAt: comment.timestamp,
    parentCommentId: comment.parentCommentId,
    likes: 0,
    mentionAuthorIds: [],
    commentOptions: { hideReplies: false, hideLikes: false },
  })
  await dbStatusUpdates.updateStatusUpdateCommentCount(
    updateId,
    (update.commentCount ?? 0) + 1
  )
  return comment
}

export async function updateProjectProperties(
  teamId: string,
  patch: Partial<ProjectProperties>
): Promise<ProjectProperties> {
  const current = await dbProjectProperties.getProjectPropertiesByTeamId(teamId)
  const merged = { ...current, ...patch }
  await dbProjectProperties.upsertProjectProperties(teamId, merged)
  return merged
}
