import type { ProjectStatus } from '../../../constants/projectStatus'

export type StatusUpdateComposerProps = {
  status?: ProjectStatus
  onStatusChange?: (status: ProjectStatus) => void
  placeholder?: string
  /** Receives markdown converted from the rich text editor (API + previews). */
  onPost?: (content: string, status: ProjectStatus) => void
  onCancel?: () => void
  className?: string
}
