import type { Request, Response } from 'express'
import * as teamsModel from '../models/teams.js'
import * as issuesModel from '../models/issues.js'
import { getUserId } from '../middleware/auth.js'
import { logApiError } from '../utils/log.js'

const DEFAULT_USER_ID = 'current-user'
const DEFAULT_AUTHOR_NAME = 'You'

export async function getTeam(req: Request, res: Response) {
  try {
    const { teamId } = req.params
    const team = await teamsModel.getTeamById(teamId)
    if (!team) {
      res.status(404).json({ error: 'Team not found' })
      return
    }
    res.json({ id: team.id, name: team.name })
  } catch (e) {
    logApiError(e, 'teams.getTeam', { teamId: req.params.teamId })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getTeamMembers(req: Request, res: Response) {
  try {
    const { teamId } = req.params
    const members = await teamsModel.getTeamMembersForApi(teamId)
    if (!members) {
      res.status(404).json({ error: 'Team not found' })
      return
    }
    res.json(members)
  } catch (e) {
    logApiError(e, 'teams.getTeamMembers', { teamId: req.params.teamId })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function addTeamMember(req: Request, res: Response) {
  try {
    const { teamId } = req.params
    const body = req.body as { memberId?: unknown }
    const memberId =
      typeof body.memberId === 'string' ? body.memberId.trim() : ''
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' })
      return
    }

    const result = await teamsModel.addMemberToTeam(teamId, memberId)
    if (!result.ok) {
      if (result.error === 'team_not_found') {
        res.status(404).json({ error: 'Team not found' })
        return
      }
      res.status(404).json({ error: 'Member not found' })
      return
    }

    res.status(201).json({ ok: true, teamId, memberId })
  } catch (e) {
    logApiError(e, 'teams.addTeamMember', {
      teamId: req.params.teamId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getTeamProject(req: Request, res: Response) {
  try {
    const { teamId } = req.params
    const data = await teamsModel.getTeamProject(teamId)
    if (!data) {
      res.status(404).json({ error: 'Team not found' })
      return
    }
    if (data.project === null) {
      res.json({ team: data.team, project: null })
      return
    }
    const nodes = data.project.statusUpdates.nodes.map((u) => ({
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
    }))
    res.json({
      team: data.team,
      project: {
        id: data.project.id,
        description: data.project.description,
        statusUpdates: { nodes },
        properties: data.project.properties,
        activity: data.project.activity,
      },
    })
  } catch (e) {
    logApiError(e, 'teams.getTeamProject', { teamId: req.params.teamId })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getTeamProjectIssues(req: Request, res: Response) {
  try {
    const { teamId } = req.params
    const filter = (req.query.filter as 'all' | 'active' | 'backlog') ?? 'all'
    const projectIdFromQuery = req.query.projectId as string | undefined
    let projectId: string
    if (projectIdFromQuery && projectIdFromQuery.trim() !== '') {
      const data = await teamsModel.getTeamProject(teamId)
      if (!data) {
        res.status(404).json({ error: 'Team not found' })
        return
      }
      const project = await teamsModel.getProjectByIdIfBelongsToTeam(
        projectIdFromQuery.trim(),
        teamId
      )
      if (!project) {
        res.json([])
        return
      }
      projectId = project.id
    } else {
      const data = await teamsModel.getTeamProject(teamId)
      if (!data) {
        res.status(404).json({ error: 'Team not found' })
        return
      }
      if (data.project === null) {
        res.json([])
        return
      }
      projectId = data.project.id
    }
    const issues = await issuesModel.getProjectIssuesForApi(projectId, filter)
    res.json(issues)
  } catch (e) {
    logApiError(e, 'teams.getTeamProjectIssues', {
      teamId: req.params.teamId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function postStatusUpdate(req: Request, res: Response) {
  try {
    const { teamId } = req.params
    const { content, status, projectId, issueId } = req.body as {
      content?: string
      status?: string
      projectId?: string
      issueId?: string
    }
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'content is required' })
      return
    }
    const validStatus =
      status === 'at-risk' || status === 'off-track' ? status : 'on-track'
    const userId = getUserId(req, DEFAULT_USER_ID)
    const author = {
      id: userId,
      name: DEFAULT_AUTHOR_NAME,
      avatarSrc: undefined as string | undefined,
    }
    const update = await teamsModel.addStatusUpdate(
      teamId,
      content,
      validStatus,
      author,
      {
        projectId: projectId ?? null,
        issueId: issueId ?? null,
      }
    )
    res.status(201).json(update)
  } catch (e) {
    logApiError(e, 'teams.postStatusUpdate', { teamId: req.params.teamId })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function patchProject(req: Request, res: Response) {
  try {
    const { teamId } = req.params
    const body = req.body as Record<string, unknown>
    const properties = await teamsModel.updateProjectProperties(teamId, body)
    res.json(properties)
  } catch (e) {
    logApiError(e, 'teams.patchProject', { teamId: req.params.teamId })
    res.status(500).json({ error: (e as Error).message })
  }
}
