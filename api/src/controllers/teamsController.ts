import type { Request, Response } from 'express'
import * as teamsModel from '../models/teams.js'
import * as issuesModel from '../models/issues.js'
import { getUserId } from '../middleware/auth.js'
import { logApiError } from '../utils/log.js'
import * as aiController from './aiController.js'

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

const AI_AUTHOR_ID = 'ai'
const AI_AUTHOR_NAME = 'AI'
const AI_SUMMARY_PREFIX = '[ai-generated]'

/** Build a text context from project details, issues, and status updates for Gemini. */
function buildProjectContext(params: {
  projectName: string
  projectId: string
  properties: { status?: string; priority?: string }
  issues: {
    id: string
    title: string
    status: string
    assignee?: { name: string } | null
  }[]
  statusUpdates: { status: string; authorName: string; content: string }[]
}): string {
  const lines: string[] = [
    `Project: ${params.projectName} (id: ${params.projectId})`,
    '',
  ]
  if (params.properties?.status || params.properties?.priority) {
    lines.push(
      `Status: ${params.properties.status ?? '—'}. Priority: ${params.properties.priority ?? '—'}.`
    )
    lines.push('')
  }
  if (params.issues.length > 0) {
    lines.push('Issues:')
    for (const i of params.issues) {
      lines.push(
        `- ${i.id}: ${i.title} [${i.status}]${i.assignee?.name ? ` (${i.assignee.name})` : ''}`
      )
    }
    lines.push('')
  }
  if (params.statusUpdates.length > 0) {
    lines.push('Status updates:')
    for (const u of params.statusUpdates) {
      lines.push(`- [${u.status}] ${u.authorName}: ${u.content}`)
    }
  }
  return lines.join('\n')
}

/** Generate an AI summary via Gemini, store it as a status update with [ai-generated] prefix, return the update. */
export async function postProjectSummary(req: Request, res: Response) {
  try {
    const { teamId } = req.params
    const data = await teamsModel.getTeamProject(teamId)
    if (!data) {
      res.status(404).json({ error: 'Team not found' })
      return
    }
    if (data.project === null) {
      res.status(400).json({ error: 'No project linked to this team.' })
      return
    }
    const projectId = data.project.id
    const projectMeta = await teamsModel.getProjectByIdIfBelongsToTeam(
      projectId,
      teamId
    )
    const projectName = projectMeta?.name ?? 'Project'
    const issues = await issuesModel.getProjectIssuesForApi(projectId, 'all')
    const context = buildProjectContext({
      projectName,
      projectId,
      properties: data.project.properties ?? {},
      issues,
      statusUpdates: data.project.statusUpdates.nodes.map((u) => ({
        status: u.status,
        authorName: u.authorName ?? 'Unknown',
        content: u.content,
      })),
    })
    const summaryText =
      await aiController.generateProjectSummaryFromContext(context)
    const content = `${AI_SUMMARY_PREFIX} ${summaryText}`
    const author = {
      id: AI_AUTHOR_ID,
      name: AI_AUTHOR_NAME,
      avatarSrc: undefined as string | undefined,
    }
    const update = await teamsModel.addStatusUpdate(
      teamId,
      content,
      'on-track',
      author,
      { projectId, issueId: null }
    )
    res.status(201).json({
      id: update.id,
      status: update.status,
      content: update.content,
      author: {
        id: update.authorId,
        name: update.authorName,
        avatarSrc: update.authorAvatarSrc,
      },
      createdAt: update.createdAt,
      commentCount: update.commentCount,
    })
  } catch (e) {
    logApiError(e, 'teams.postProjectSummary', { teamId: req.params.teamId })
    res.status(500).json({ error: (e as Error).message })
  }
}
