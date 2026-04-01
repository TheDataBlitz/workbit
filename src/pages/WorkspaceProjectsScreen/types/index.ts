import type { ProjectTableRow } from '../utils/createProjectColumn'

export type WorkspaceProjectsParams = {
  workspaceId: string
}

export type ProjectRow = ProjectTableRow

export type ApiProjectSummary = {
  id: string
  name: string
  status: string
  team: {
    id: string
    name: string
  }
}
