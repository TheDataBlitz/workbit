import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Alert } from '@thedatablitz/alert'
import { PageHeader } from '@thedatablitz/page-header'
import { fetchWorkspaceTeams } from '../../api/client'
import { useFetch } from '../../hooks/useFetch'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import type { WorkspaceTeamsScreenRouteParams, TeamTableRow } from './types'
import { mapTeamsToRows } from './utils'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Table, type ColumnDef } from '@thedatablitz/table'

export function WorkspaceTeamsScreen() {
  const { workspaceId } = useParams<WorkspaceTeamsScreenRouteParams>()
  const navigate = useNavigate()
  const { currentWorkspace } = useWorkspace()
  const { data, loading, error } = useFetch(
    () =>
      currentWorkspace
        ? fetchWorkspaceTeams(currentWorkspace.id)
        : Promise.resolve([]),
    [currentWorkspace?.id]
  )

  const teams = mapTeamsToRows(data ?? [])
  const columns = useMemo<ColumnDef<TeamTableRow>[]>(
    () => [
      {
        accessorKey: 'teamName',
        header: 'Team',
        cell: ({ row }) =>
          workspaceId ? (
            <Button
              variant="glass"
              size="small"
              onClick={() =>
                navigate(
                  `/workspace/${workspaceId}/team/${row.original.id}/issues/active`
                )
              }
            >
              {row.original.teamName}
            </Button>
          ) : (
            row.original.teamName
          ),
      },
      {
        accessorKey: 'members',
        header: 'Members',
        cell: ({ row }) => `${row.original.members} members`,
      },
      {
        accessorKey: 'project',
        header: 'Project',
        cell: ({ row }) => row.original.project || '-',
      },
    ],
    [navigate, workspaceId]
  )

  return (
    <Stack gap="400" fullWidth>
      <Inline
        align="flex-start"
        justify="space-between"
        gap="200"
        fullWidth
        wrap
      >
        <div className="min-w-0 flex-1">
          <PageHeader
            avatar={{
              name: 'Teams',
            }}
            title="Teams"
            subtitle="Workspace teams, members and projects."
          />
        </div>
        {workspaceId ? (
          <Button
            variant="glass"
            className="shrink-0"
            onClick={() =>
              navigate(`/workspace/${workspaceId}/workspace/teams/new`)
            }
          >
            <Plus size={16} />
            New Team
          </Button>
        ) : null}
      </Inline>
      {error ? (
        <Alert
          variant="error"
          placement="inline"
          description={`Failed to load teams: ${error}`}
          className="w-full"
        />
      ) : null}
      {!loading && workspaceId ? (
        <Table<TeamTableRow>
          data={teams}
          columns={columns}
          searchable
          columnFilterable={false}
        />
      ) : null}
    </Stack>
  )
}
