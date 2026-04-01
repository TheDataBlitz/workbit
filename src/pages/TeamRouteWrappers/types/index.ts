export type TeamRouteParams = {
  workspaceId: string
  teamId: string
}

export type TeamProjectRouteParams = {
  workspaceId: string
  teamId: string
  projectId: string
}

/** Segment after project id for main project detail tabs (not documentation). */
export type TeamProjectDetailTabParams = TeamProjectRouteParams & {
  projectDetailTab: string
}

export type TeamProjectDocumentRouteParams = TeamProjectRouteParams & {
  documentId: string
}

export type TeamIssueRouteParams = {
  teamId: string
  issueId: string
}
