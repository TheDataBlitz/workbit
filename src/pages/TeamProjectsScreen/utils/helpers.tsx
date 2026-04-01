import type { TeamProjectColumnDef, TeamProjectRow } from '../types'

type WorkspaceProject = {
  id: string
  name: string
  status: string
  team: {
    id: string
  }
}

export function createColumns(
  onProjectOpen?: (row: TeamProjectRow) => void
): TeamProjectColumnDef[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Project',
      meta: { flex: 1.5 },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onProjectOpen?.(row.original)
          }}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            color: 'inherit',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      meta: { flex: 1 },
      cell: ({ row }) => row.original.status,
    },
  ]
}

export function toTeamProjects(
  workspaceProjects: WorkspaceProject[],
  teamId?: string
): TeamProjectRow[] {
  if (!teamId) return []

  return workspaceProjects
    .filter((project) => project.team.id === teamId)
    .map((project) => ({
      id: project.id,
      name: project.name,
      status: project.status,
    }))
}

export function getTeamProjectPath(
  workspaceId: string,
  teamId: string,
  projectId: string
): string {
  return `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}/overview`
}

export function getNewTeamProjectPath(
  workspaceId: string,
  teamId: string
): string {
  return `/workspace/${workspaceId}/team/${teamId}/projects/new`
}
