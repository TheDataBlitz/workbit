import type { Request, Response } from 'express'
import * as issuesModel from '../models/issues.js'
import { logApiError } from '../utils/log.js'

export async function getProjectIssues(req: Request, res: Response) {
  try {
    const { projectId } = req.params
    const filter = (req.query.filter as 'all' | 'active' | 'backlog') ?? 'all'
    const list = await issuesModel.getProjectIssuesForApi(projectId, filter)
    res.json(list)
  } catch (e) {
    logApiError(e, 'issues.getProjectIssues', {
      projectId: req.params.projectId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getIssue(req: Request, res: Response) {
  try {
    const { issueId } = req.params
    const detail = await issuesModel.getIssueDetailForApi(issueId)
    if (!detail) {
      res.status(404).json({ error: 'Issue not found' })
      return
    }
    res.json(detail)
  } catch (e) {
    logApiError(e, 'issues.getIssue', { issueId: req.params.issueId })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function getSubIssues(req: Request, res: Response) {
  try {
    const { issueId } = req.params
    const parentIssue = await issuesModel.getIssueById(issueId)
    if (!parentIssue) {
      res.status(404).json({ error: 'Issue not found' })
      return
    }
    const list = await issuesModel.getSubIssuesForApi(issueId)
    res.json(list)
  } catch (e) {
    logApiError(e, 'issues.getSubIssues', { issueId: req.params.issueId })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function generateSubIssues(req: Request, res: Response) {
  try {
    const { issueId } = req.params
    const subIssues = await issuesModel.generateSubIssuesDraftForIssue(issueId)
    res.json({ issueId, subIssues })
  } catch (e) {
    logApiError(e, 'issues.generateSubIssues', {
      issueId: req.params.issueId,
    })
    const err = e as Error
    if (err.message === 'Issue not found') {
      res.status(404).json({ error: err.message })
      return
    }
    res.status(500).json({ error: err.message })
  }
}

export async function createIssue(req: Request, res: Response) {
  try {
    const body = req.body as {
      projectId?: string
      title?: string
      description?: string
      status?: string
      body?: string
      parentIssueId?: string
    }
    const projectId = (body.projectId ?? '').trim()
    const title = body.title
    const description = body.description
    const status = body.status
    const parentIssueId =
      body.parentIssueId && body.parentIssueId !== ''
        ? body.parentIssueId
        : undefined

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'title is required' })
      return
    }
    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' })
      return
    }
    const issue = await issuesModel.createIssueForApi({
      projectId,
      title: title.trim(),
      description,
      status,
      parentIssueId,
    })
    const detail = await issuesModel.getIssueDetailForApi(issue.id)
    if (!detail) {
      res.status(201).json({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        assignee: null,
        date: issue.date,
        status: issue.status,
        project_id: issue.projectId ?? null,
        parentIssueId: issue.parentIssueId ?? null,
      })
      return
    }
    res.status(201).json(detail)
  } catch (e) {
    const msg = (e as Error).message
    logApiError(e, 'issues.createIssue', {
      projectId: (req.body as { projectId?: string }).projectId,
    })
    if (
      msg.startsWith('Project not found:') ||
      msg.startsWith('Parent issue not found:')
    ) {
      res.status(404).json({ error: msg })
      return
    }
    res.status(500).json({ error: msg })
  }
}

export async function updateIssue(req: Request, res: Response) {
  try {
    const { issueId } = req.params
    const body = req.body as {
      status?: string
      assigneeId?: string
      assigneeName?: string
      projectId?: string | null
      description?: string
      parentIssueId?: string | null
    }
    const detail = await issuesModel.updateIssueForApi(issueId, {
      status: body.status,
      assigneeId: body.assigneeId,
      assigneeName: body.assigneeName,
      projectId: body.projectId,
      description: body.description,
      parentIssueId: body.parentIssueId,
    })
    if (!detail) {
      res.status(404).json({ error: 'Issue not found' })
      return
    }
    res.json(detail)
  } catch (e) {
    const msg = (e as Error).message
    logApiError(e, 'issues.updateIssue', { issueId: req.params.issueId })
    if (msg.startsWith('Project not found:')) {
      res.status(404).json({ error: msg })
      return
    }
    res.status(500).json({ error: (e as Error).message })
  }
}
