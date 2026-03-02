import type { Issue } from './types.js'
import * as db from '../db/issues.js'
import { getTeamById } from '../db/teams.js'

export async function getTeamIssues(
  teamId: string,
  filter?: 'all' | 'active' | 'backlog'
): Promise<Issue[]> {
  const team = await getTeamById(teamId)
  if (team?.projectId) {
    return db.getIssuesByProjectId(team.projectId, filter)
  }
  return db.getIssuesByTeamId(teamId, filter)
}

export async function getProjectIssues(
  projectId: string,
  filter?: 'all' | 'active' | 'backlog'
): Promise<Issue[]> {
  return db.getIssuesByProjectId(projectId, filter)
}

export async function getMyIssues(assigneeId: string): Promise<Issue[]> {
  return db.getIssuesByAssigneeId(assigneeId)
}

export async function updateIssue(
  issueId: string,
  patch: Partial<
    Pick<
      Issue,
      'status' | 'assigneeId' | 'assigneeName' | 'projectId' | 'description'
    >
  >
): Promise<Issue | null> {
  return db.updateIssue(issueId, patch)
}

export async function getIssueById(issueId: string): Promise<Issue | null> {
  return db.getIssueById(issueId)
}

export async function createIssue(input: {
  title: string
  teamId?: string
  projectId?: string
  assigneeId?: string
  status?: string
  description?: string
}): Promise<Issue> {
  if (input.teamId) {
    const team = await getTeamById(input.teamId)
    if (!team) {
      throw new Error('Team not found')
    }
  }

  const issue: Issue = {
    id: `ISS-${Date.now()}`,
    title: input.title,
    teamId: input.teamId,
    projectId: input.projectId,
    assigneeId: input.assigneeId,
    status: input.status ?? 'todo',
    date: new Date().toISOString(),
    description: input.description,
  }

  await db.insertIssue(issue)
  return issue
}
