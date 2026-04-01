export type ProjectDetailTab =
  | 'overview'
  | 'updates'
  | 'issues'
  | 'documentation'
  | 'decisions'

export type TeamProjectDetailScreenProps = {
  projectName: string
  teamId: string
  /** Current tab from the URL (e.g. …/projects/:id/overview). */
  activeTab: ProjectDetailTab
  /** When set, Documentation tab shows the multi-document list (used on /documentation URL). */
  documentationMode?: 'list'
}

export type ProjectDetailIssueRow = {
  id: string
  title: string
  status: string
  priority: string
  dateLabel: string
  assigneeInitials: string
  parentIssueId: string | null
  assignee: { id: string; name: string } | null
  subIssueCount: number
  depth: number
  isSubtaskRow: boolean
  subRows?: ProjectDetailIssueRow[]
  __placeholder?: boolean
}

export type ProjectDetailDocumentRow = {
  id: string
  title: string
  updatedLabel: string
  updatedBy: string
}
