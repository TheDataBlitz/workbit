import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { Box } from '@thedatablitz/box'
import { Alert } from '@thedatablitz/alert'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Table, type ColumnDef } from '@thedatablitz/table'
import { Text } from '@thedatablitz/text'

import { fetchProjectDocuments } from '../../api/client'
import { formatDateTime } from '../../utils/format'
import { logError } from '../../utils/errorHandling'
import type { ProjectDetailDocumentRow } from './types'

export const projectDocumentsQueryKey = (projectId: string | undefined) =>
  ['project', projectId ?? '__none__', 'documents'] as const

export type ProjectDetailDocumentsTabProps = {
  workspaceId?: string
  teamId?: string
  projectId?: string
}

export function ProjectDetailDocumentsTab({
  workspaceId,
  teamId,
  projectId,
}: ProjectDetailDocumentsTabProps) {
  const navigate = useNavigate()

  const documentsQuery = useQuery({
    queryKey: projectDocumentsQueryKey(projectId),
    queryFn: async () => {
      try {
        return await fetchProjectDocuments(projectId!)
      } catch (e) {
        logError(e, 'ProjectDetailDocumentsTab.fetchProjectDocuments')
        throw e
      }
    },
    enabled: Boolean(projectId),
  })

  const documents = documentsQuery.data ?? []
  const loading = documentsQuery.isLoading
  const error =
    documentsQuery.isError && documentsQuery.error
      ? documentsQuery.error instanceof Error
        ? documentsQuery.error.message
        : 'Failed to load documents'
      : null

  const documentRows: ProjectDetailDocumentRow[] = useMemo(
    () =>
      documents.map((doc) => ({
        id: doc.id,
        title: doc.title || 'Untitled',
        updatedLabel: doc.updatedAt ? formatDateTime(doc.updatedAt) : '—',
        updatedBy: doc.updatedBy ?? '—',
      })),
    [documents]
  )

  const documentColumns = useMemo<
    ColumnDef<ProjectDetailDocumentRow, unknown>[]
  >(
    () => [
      {
        id: 'title',
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => (
          <Button
            buttonType="link"
            onClick={() => {
              if (workspaceId && teamId && projectId) {
                navigate(
                  `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}/documentation/${row.original.id}`
                )
              }
            }}
          >
            <Text variant="body2" truncate>
              {row.original.title}
            </Text>
          </Button>
        ),
      },
      {
        id: 'updated',
        accessorKey: 'updatedLabel',
        header: 'Updated',
        cell: ({ row }) => (
          <Text variant="body3" color="color.text.subtle">
            {row.original.updatedLabel}
          </Text>
        ),
      },
      {
        id: 'updatedBy',
        accessorKey: 'updatedBy',
        header: 'Updated by',
        cell: ({ row }) => (
          <Text variant="body3" color="color.text.subtle">
            {row.original.updatedBy}
          </Text>
        ),
      },
    ],
    [workspaceId, teamId, projectId, navigate]
  )

  return (
    <Box border padding="400">
      <Stack gap="300">
        <Inline align="center" justify="space-between" fullWidth>
          <Text variant="heading5">Project documentation</Text>
          {workspaceId && teamId && projectId ? (
            <Button
              variant="primary"
              size="small"
              icon={<Plus size={16} />}
              onClick={() =>
                navigate(
                  `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}/documentation/new`
                )
              }
            >
              Add document
            </Button>
          ) : null}
        </Inline>

        {error ? (
          <Alert
            variant="error"
            placement="inline"
            description={error}
            className="w-full"
          />
        ) : null}

        {loading ? (
          <Text variant="body3" color="color.text.subtle">
            Loading documents...
          </Text>
        ) : documents.length === 0 ? (
          <Box border padding="400" fullWidth>
            <Stack align="center">
              <Text variant="body3" color="color.text.subtle">
                No documents yet. Add one to get started.
              </Text>
            </Stack>
          </Box>
        ) : (
          <Table<ProjectDetailDocumentRow>
            data={documentRows}
            columns={documentColumns}
            size="medium"
            searchable={false}
            columnFilterable={false}
            emptyMessage="No documents"
          />
        )}
      </Stack>
    </Box>
  )
}
