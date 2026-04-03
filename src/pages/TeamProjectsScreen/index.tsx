import { useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Table } from '@thedatablitz/table'

import { InteleBit } from '../../components/InteleBit'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import type {
  TeamProjectColumnDef,
  TeamProjectRow,
  TeamProjectsParams,
  TeamProjectsScreenProps,
} from './types'
import {
  createColumns,
  getNewTeamProjectPath,
  getTeamProjectPath,
  toTeamProjects,
} from './utils/helpers'
import { Button } from '@thedatablitz/button'
import { PageHeader } from '@thedatablitz/page-header'

export function TeamProjectsScreen({ teamName }: TeamProjectsScreenProps) {
  const { workspaceId, teamId } = useParams<TeamProjectsParams>()
  const navigate = useNavigate()
  const { projects: workspaceProjects } = useWorkspace()
  const projects = toTeamProjects(workspaceProjects, teamId)

  const handleOpenAsk = useCallback((row: TeamProjectRow) => {
    InteleBit.ask({ projectId: row.id, projectName: row.name })
  }, [])

  const handleRowClick = useCallback(
    (row: TeamProjectRow) => {
      if (workspaceId && teamId) {
        navigate(getTeamProjectPath(workspaceId, teamId, row.id))
      }
    },
    [navigate, teamId, workspaceId]
  )

  const columns = useMemo<TeamProjectColumnDef[]>(
    () => createColumns(handleRowClick, handleOpenAsk),
    [handleOpenAsk, handleRowClick]
  )

  const handleNewProject = () => {
    if (workspaceId && teamId) {
      navigate(getNewTeamProjectPath(workspaceId, teamId))
    }
  }

  return (
    <Stack gap="400">
      <PageHeader
        avatar={{
          name: 'Projects',
        }}
        title={`${teamName} - Projects`}
        subtitle="Projects for this team."
      />
      <Inline justify="flex-end">
        <Button
          variant="glass"
          icon={<Plus size={16} />}
          onClick={handleNewProject}
        >
          New Project
        </Button>
      </Inline>

      <Table
        columns={columns}
        data={projects}
        size="medium"
        searchable
        columnFilterable
        emptyMessage="No projects found"
        renderExpandedRow={(row) => (
          <Text variant="body3" color="color.text.subtle">
            Project ID: {row.original.id}
          </Text>
        )}
      />
    </Stack>
  )
}
