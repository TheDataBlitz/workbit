import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type {
  ProjectStatus,
  StatusUpdateCardData,
  UpdateItem,
} from '../../../components'
import {
  fetchTeamProject,
  fetchStatusUpdateComments,
  postComment,
  postStatusUpdate,
} from '../../../api/client'
import { formatDateTime } from '../../../utils/format'
import { logError } from '../../../utils/errorHandling'
import { apiUpdateToCard } from '../utils/helpers'

export const teamProjectUpdatesQueryKey = (teamId: string) =>
  ['teamProject', teamId, 'statusUpdates'] as const

export type TeamProjectUpdatesQueryData = {
  updates: StatusUpdateCardData[]
  commentsByUpdateId: Record<string, UpdateItem[]>
}

function mapStatusCommentsToUpdateItems(params: {
  updateId: string
  status: ProjectStatus
  comments: Array<{
    id: string
    authorName: string
    timestamp: string
    content: string
    parentCommentId: string | null
  }>
}): UpdateItem[] {
  const commentsById = new Map(params.comments.map((c) => [c.id, c]))
  return params.comments.map((comment) => {
    const parentId =
      comment.parentCommentId && commentsById.has(comment.parentCommentId)
        ? `${params.updateId}:comment:${comment.parentCommentId}`
        : params.updateId
    return {
      id: `${params.updateId}:comment:${comment.id}`,
      kind: 'comment' as const,
      updateId: params.updateId,
      parentId,
      content: comment.content,
      author: comment.authorName,
      timestamp: formatDateTime(comment.timestamp),
      status: params.status,
      comments: [],
      reactions: {},
    }
  })
}

async function fetchTeamProjectUpdatesData(
  teamId: string
): Promise<TeamProjectUpdatesQueryData> {
  const data = await fetchTeamProject(teamId)
  if (!data.project) {
    return { updates: [], commentsByUpdateId: {} }
  }

  const nextUpdates = data.project.statusUpdates.nodes.map(apiUpdateToCard)
  if (nextUpdates.length === 0) {
    return { updates: nextUpdates, commentsByUpdateId: {} }
  }

  const entries = await Promise.all(
    nextUpdates.map(async (update) => {
      const comments = await fetchStatusUpdateComments(teamId, update.id)
      const mapped = mapStatusCommentsToUpdateItems({
        updateId: update.id,
        status: update.status,
        comments,
      })
      return [update.id, mapped] as const
    })
  )

  return {
    updates: nextUpdates,
    commentsByUpdateId: Object.fromEntries(entries),
  }
}

export type UseProjectDetailUpdatesResult = {
  updates: StatusUpdateCardData[]
  updatesTreeItems: UpdateItem[]
  featuredUpdate: UpdateItem | undefined
  handlePostUpdate: (content: string, status: ProjectStatus) => void
  handleAddComment: (item: UpdateItem, content: string) => Promise<void>
  /** True while the initial updates + comments query is loading */
  isLoading: boolean
}

/**
 * Loads status updates + comments via React Query. Call once from the screen;
 * use the return value for Overview and {@link ProjectDetailUpdatesTab}.
 */
export function useProjectDetailUpdates(
  teamId: string | undefined,
  projectId: string | undefined
): UseProjectDetailUpdatesResult {
  const queryClient = useQueryClient()

  const updatesQuery = useQuery({
    queryKey: teamProjectUpdatesQueryKey(teamId ?? '__none__'),
    queryFn: () => fetchTeamProjectUpdatesData(teamId!),
    enabled: Boolean(teamId),
  })

  const updates = updatesQuery.data?.updates ?? []
  const commentsByUpdateId = updatesQuery.data?.commentsByUpdateId ?? {}

  const postUpdateMutation = useMutation({
    mutationFn: async ({
      content,
      status,
    }: {
      content: string
      status: ProjectStatus
    }) => {
      if (!teamId) throw new Error('teamId is required')
      return postStatusUpdate(
        teamId,
        content,
        status,
        projectId ? { projectId } : undefined
      )
    },
    onSuccess: (rawUpdate) => {
      if (!teamId) return
      const card = apiUpdateToCard(rawUpdate)
      const key = teamProjectUpdatesQueryKey(teamId)
      queryClient.setQueryData<TeamProjectUpdatesQueryData>(key, (old) => {
        const prev = old ?? { updates: [], commentsByUpdateId: {} }
        return {
          updates: [card, ...prev.updates],
          commentsByUpdateId: {
            ...prev.commentsByUpdateId,
            [card.id]: prev.commentsByUpdateId[card.id] ?? [],
          },
        }
      })
    },
    onError: (e) => logError(e, 'useProjectDetailUpdates.postUpdate'),
  })

  const postCommentMutation = useMutation({
    mutationFn: async ({
      updateId,
      content,
      parentCommentId,
    }: {
      updateId: string
      content: string
      parentCommentId?: string | null
    }) => {
      if (!teamId) throw new Error('teamId is required')
      return postComment(teamId, updateId, content, {
        parentCommentId: parentCommentId ?? undefined,
      })
    },
    onSuccess: (result, variables) => {
      if (!teamId) return
      const updateId = variables.updateId
      const key = teamProjectUpdatesQueryKey(teamId)
      queryClient.setQueryData<TeamProjectUpdatesQueryData>(key, (old) => {
        const prev = old ?? { updates: [], commentsByUpdateId: {} }
        const statusUpdate = prev.updates.find((u) => u.id === updateId)
        const status = statusUpdate?.status ?? 'on-track'
        const createdItems = mapStatusCommentsToUpdateItems({
          updateId,
          status,
          comments: result.comments,
        })
        return {
          updates: prev.updates.map((update) =>
            update.id === updateId
              ? {
                  ...update,
                  commentCount:
                    (update.commentCount ?? 0) + createdItems.length,
                }
              : update
          ),
          commentsByUpdateId: {
            ...prev.commentsByUpdateId,
            [updateId]: [
              ...(prev.commentsByUpdateId[updateId] ?? []),
              ...createdItems,
            ],
          },
        }
      })
    },
    onError: (e) => logError(e, 'useProjectDetailUpdates.postComment'),
  })

  const updatesTreeItems: UpdateItem[] = useMemo(
    () =>
      updates.map((update) => ({
        id: update.id,
        kind: 'update' as const,
        updateId: update.id,
        parentId: null,
        content: update.content,
        author: update.authorName,
        timestamp: update.timestamp,
        status: update.status,
        comments: commentsByUpdateId[update.id] ?? [],
      })),
    [updates, commentsByUpdateId]
  )

  const featuredUpdate = updatesTreeItems[0]

  const handlePostUpdate = useCallback(
    (content: string, status: ProjectStatus) => {
      if (!teamId) return
      postUpdateMutation.mutate({ content, status })
    },
    [teamId, postUpdateMutation.mutate]
  )

  const handleAddComment = useCallback(
    async (item: UpdateItem, content: string) => {
      if (!teamId) return
      const updateId = item.updateId
      const parentCommentId =
        item.kind === 'comment'
          ? item.id.replace(`${updateId}:comment:`, '')
          : undefined
      await postCommentMutation.mutateAsync({
        updateId,
        content,
        parentCommentId,
      })
    },
    [teamId, postCommentMutation.mutateAsync]
  )

  return {
    updates,
    updatesTreeItems,
    featuredUpdate,
    handlePostUpdate,
    handleAddComment,
    isLoading: updatesQuery.isPending,
  }
}
