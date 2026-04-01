import type { ProjectStatus } from '../../../constants/projectStatus'

/** Thread row shape compatible with `@thedatablitz/comment` `CommentItem`. */
export type StatusUpdateCardComment = {
  commentId: string
  /** Rich text as serialized Lexical JSON or plain text. */
  commentText: string
  commentDate: string
  commentAuthor: string
  commentAuthorAvatar: string
  parentCommentId: string | null
  likes: number
  mentionAuthorIds: string[]
}

export type StatusUpdateCardData = {
  id: string
  status: ProjectStatus
  authorName: string
  authorAvatarSrc?: string
  timestamp: string
  content: string
  commentCount?: number
}

export type StatusUpdateCardProps = {
  data: StatusUpdateCardData
  comments?: StatusUpdateCardComment[]
  onNewUpdate?: () => void
  onCommentsClick?: () => void
  /** Called when the user submits a new comment (plain or serialized editor state). */
  onSendComment?: (text: string) => void
  onMore?: (action: 'edit' | 'delete') => void
  className?: string
}
