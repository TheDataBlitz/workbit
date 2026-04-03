import type { Request, Response } from 'express'
import * as teamsModel from '../models/teams.js'
import * as issuesModel from '../models/issues.js'
import { logApiError } from '../utils/log.js'
import { isSerializedCommentEmpty } from '../utils/lexicalCommentContent.js'

const DEFAULT_AUTHOR_NAME = 'You'

export async function getIssueComments(req: Request, res: Response) {
  try {
    const { issueId } = req.params
    const comments = await issuesModel.getIssueComments(issueId)
    res.json(
      comments.map((c) => ({
        id: c.id,
        entityId: c.entityId,
        authorName: c.authorName,
        authorAvatarSrc: c.authorAvatarSrc,
        content: c.content,
        createdAt: c.createdAt,
        parentCommentId: c.parentCommentId,
        likes: c.likes,
        mentionAuthorIds: c.mentionAuthorIds,
        commentOptions: c.commentOptions,
      }))
    )
  } catch (e) {
    logApiError(e, 'comments.getIssueComments', {
      issueId: req.params.issueId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function postIssueComment(req: Request, res: Response) {
  try {
    const { issueId } = req.params
    const { content, parentCommentId } = req.body as {
      content?: string
      parentCommentId?: string | null
    }
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'content is required' })
      return
    }
    const authorName = req.user?.email ?? DEFAULT_AUTHOR_NAME
    const comment = await issuesModel.addIssueComment(
      issueId,
      content,
      {
        name: authorName,
        avatarSrc: undefined,
      },
      {
        parentCommentId:
          parentCommentId === undefined || parentCommentId === ''
            ? null
            : parentCommentId,
      }
    )
    res.status(201).json({
      id: comment.id,
      entityId: comment.entityId,
      authorName: comment.authorName,
      authorAvatarSrc: comment.authorAvatarSrc,
      content: comment.content,
      createdAt: comment.createdAt,
      parentCommentId: comment.parentCommentId,
      likes: comment.likes,
      mentionAuthorIds: comment.mentionAuthorIds,
      commentOptions: comment.commentOptions,
    })
  } catch (e) {
    logApiError(e, 'comments.postIssueComment', {
      issueId: req.params.issueId,
    })
    const err = e as Error
    if (err.message === 'Issue not found') {
      res.status(404).json({ error: err.message })
      return
    }
    if (err.message === 'Parent comment not found') {
      res.status(400).json({ error: err.message })
      return
    }
    res.status(500).json({ error: err.message })
  }
}

export async function getStatusUpdateComments(req: Request, res: Response) {
  try {
    const { updateId } = req.params
    const comments = await teamsModel.getStatusUpdateComments(updateId)
    res.json(
      comments.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        authorAvatarSrc: c.authorAvatarSrc,
        content: c.content,
        timestamp: c.timestamp,
        parentCommentId: c.parentCommentId,
      }))
    )
  } catch (e) {
    logApiError(e, 'comments.getStatusUpdateComments', {
      updateId: req.params.updateId,
    })
    res.status(500).json({ error: (e as Error).message })
  }
}

export async function postStatusUpdateComment(req: Request, res: Response) {
  try {
    const { teamId, updateId } = req.params
    const { content, parentCommentId } = req.body as {
      content?: string
      parentCommentId?: string | null
    }
    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'content is required' })
      return
    }
    if (isSerializedCommentEmpty(content)) {
      res.status(400).json({ error: 'content is required' })
      return
    }

    const authorName = req.user?.email ?? DEFAULT_AUTHOR_NAME
    const comment = await teamsModel.addStatusUpdateComment(
      teamId,
      updateId,
      content,
      authorName,
      undefined,
      {
        parentCommentId:
          parentCommentId === undefined || parentCommentId === ''
            ? null
            : parentCommentId,
      }
    )
    res.status(201).json({ comments: [comment] })
  } catch (e) {
    logApiError(e, 'comments.postStatusUpdateComment', {
      teamId: req.params.teamId,
      updateId: req.params.updateId,
    })
    const err = e as Error
    if (err.message === 'Update not found')
      res.status(404).json({ error: err.message })
    else if (err.message === 'Parent comment not found')
      res.status(400).json({ error: err.message })
    else res.status(500).json({ error: err.message })
  }
}
