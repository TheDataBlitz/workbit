import type { ApiProjectSummary, ProjectRow } from '../types'

export function toProjectRows(data: ApiProjectSummary[]): ProjectRow[] {
  return data.map((project) => ({
    id: project.id,
    name: project.name,
    team: project.team.name,
    status: project.status,
  }))
}

export function getProjectDetailPath(
  workspaceId: string,
  teamId: string,
  projectId: string
): string {
  return `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}/overview`
}

export function getNewProjectPath(workspaceId: string): string {
  return `/workspace/${workspaceId}/workspace/projects/new`
}

export function resolveTeamId(
  data: ApiProjectSummary[] | undefined,
  rowId: string,
  fallbackTeamValue: string
): string {
  return (
    data?.find((project) => project.id === rowId)?.team.id ?? fallbackTeamValue
  )
}
