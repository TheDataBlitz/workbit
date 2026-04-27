import { generateId } from './store.js'
import type { StatusUpdate, StatusUpdateComment } from './types.js'
import * as dbStatusUpdates from '../db/statusUpdates.js'
import * as dbIssueComments from '../db/issueComments.js'

export async function addStatusUpdate(input: {
  content: string
  status: 'on-track' | 'at-risk' | 'off-track'
  author: { id: string; name: string; avatarSrc?: string }
  projectId?: string | null
  issueId?: string | null
}): Promise<StatusUpdate> {
  const update: StatusUpdate = {
    id: generateId(),
    status: input.status,
    content: input.content,
    authorId: input.author.id,
    authorName: input.author.name,
    authorAvatarSrc: input.author.avatarSrc,
    createdAt: new Date().toISOString(),
    commentCount: 0,
    projectId: input.projectId ?? null,
    issueId: input.issueId ?? null,
  }
  await dbStatusUpdates.insertStatusUpdate(update)
  return update
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

export async function addStatusUpdateComment(
  updateId: string,
  content: string,
  authorName: string,
  authorAvatarSrc?: string,
  options?: { parentCommentId?: string | null }
): Promise<StatusUpdateComment> {
  if (!content.trim()) {
    throw new Error('content is required')
  }
  const update = await dbStatusUpdates.getStatusUpdateById(updateId)
  if (!update) throw new Error('Update not found')
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

