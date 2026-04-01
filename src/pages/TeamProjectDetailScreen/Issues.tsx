import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'

import { Alert } from '@thedatablitz/alert'
import { Box } from '@thedatablitz/box'
import { Badge } from '@thedatablitz/badge'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Table, type ColumnDef } from '@thedatablitz/table'
import { Text } from '@thedatablitz/text'
import { Avatar } from '@thedatablitz/avatar'

import { PrioritySelector, StatusSelector } from '../../components'
import {
  fetchSubIssues,
  fetchTeamProjectIssues,
  updateIssue as apiUpdateIssue,
} from '../../api/client'
import type { ApiSubIssue } from '../../api/client'
import { formatDateTime } from '../../utils/format'
import { logError } from '../../utils/errorHandling'
import type { ProjectDetailIssueRow } from './types'
import {
  DEFAULT_STATUS,
  DEFAULT_PRIORITY,
  INLINE_PRIORITY_OPTIONS,
  buildProjectIssueTreeData,
} from './utils/helpers'

function walkExpandedProjectIssueParents(
  table: TanStackTable<ProjectDetailIssueRow>,
  visit: (issueId: string) => void
) {
  const rec = (rows: Row<ProjectDetailIssueRow>[]) => {
    for (const row of rows) {
      const o = row.original
      if (!o.isSubtaskRow && !o.__placeholder && row.getIsExpanded()) {
        visit(o.id)
      }
      if (row.subRows?.length) {
        rec(row.subRows)
      }
    }
  }
  rec(table.getRowModel().rows)
}

export const teamProjectIssuesQueryKey = (
  teamId: string,
  projectId: string | undefined,
  filter: 'all' | 'active' | 'backlog' = 'all'
) => ['team', teamId, 'projectIssues', projectId ?? '', filter] as const

export const issueSubIssuesQueryKey = (parentIssueId: string) =>
  ['issue', parentIssueId, 'subIssues'] as const

export type ProjectDetailIssuesTabProps = {
  workspaceId?: string
  teamId?: string
  projectId?: string
}

export function ProjectDetailIssuesTab({
  workspaceId,
  teamId,
  projectId,
}: ProjectDetailIssuesTabProps) {
  const navigate = useNavigate()

  const issuesQuery = useQuery({
    queryKey: teamId
      ? teamProjectIssuesQueryKey(teamId, projectId, 'all')
      : ['team', '__none__', 'projectIssues', '', 'all'],
    queryFn: async () => {
      try {
        return await fetchTeamProjectIssues(teamId!, 'all', projectId)
      } catch (e) {
        logError(e, 'ProjectDetailIssuesTab.fetchTeamProjectIssues')
        throw e
      }
    },
    enabled: Boolean(teamId),
  })

  const projectIssues = issuesQuery.data ?? []
  const issuesLoading = issuesQuery.isLoading
  const issuesError =
    issuesQuery.isError && issuesQuery.error
      ? issuesQuery.error instanceof Error
        ? issuesQuery.error.message
        : 'Failed to load issues'
      : null

  const [issueOverrides, setIssueOverrides] = useState<
    Record<string, { status?: string; priority?: string }>
  >({})

  const allProjectIssues: ProjectDetailIssueRow[] = useMemo(
    () =>
      (projectIssues ?? []).map((issue) => ({
        ...issue,
        status:
          issueOverrides[issue.id]?.status ?? issue.status ?? DEFAULT_STATUS,
        priority: issueOverrides[issue.id]?.priority ?? DEFAULT_PRIORITY,
        dateLabel: formatDateTime(issue.date),
        assigneeInitials: issue.assignee?.name
          ? issue.assignee.name.slice(0, 2).toUpperCase()
          : '',
        subIssueCount: issue.subIssueCount ?? 0,
        depth: 0,
        isSubtaskRow: false,
      })),
    [projectIssues, issueOverrides]
  )

  const rootProjectIssues = useMemo(
    () => allProjectIssues.filter((r) => !r.parentIssueId),
    [allProjectIssues]
  )

  const [requestedSubtaskParentIds, setRequestedSubtaskParentIds] = useState<
    string[]
  >([])

  const subIssuesQueries = useQueries({
    queries: requestedSubtaskParentIds.map((parentId) => ({
      queryKey: issueSubIssuesQueryKey(parentId),
      queryFn: async () => {
        try {
          return await fetchSubIssues(parentId)
        } catch (e) {
          logError(e, 'ProjectDetailIssuesTab.fetchSubIssues')
          throw e
        }
      },
    })),
  })

  const subtasksRawByParent = useMemo(() => {
    const m: Record<string, ApiSubIssue[] | undefined> = {}
    requestedSubtaskParentIds.forEach((parentId, i) => {
      const q = subIssuesQueries[i]
      if (q.isSuccess) m[parentId] = q.data ?? []
    })
    return m
  }, [requestedSubtaskParentIds, subIssuesQueries])

  const subtasksLoadingByParent = useMemo(() => {
    const m: Record<string, boolean> = {}
    requestedSubtaskParentIds.forEach((parentId, i) => {
      if (subIssuesQueries[i]?.isPending) m[parentId] = true
    })
    return m
  }, [requestedSubtaskParentIds, subIssuesQueries])

  const subtasksErrorByParent = useMemo(() => {
    const m: Record<string, string | null> = {}
    requestedSubtaskParentIds.forEach((parentId, i) => {
      const q = subIssuesQueries[i]
      if (q?.isError) {
        m[parentId] =
          q.error instanceof Error ? q.error.message : 'Failed to load subtasks'
      }
    })
    return m
  }, [requestedSubtaskParentIds, subIssuesQueries])

  const issuesTableRef = useRef<TanStackTable<ProjectDetailIssueRow> | null>(
    null
  )
  const issuesExpandedJsonRef = useRef('')
  const [issuesExpandPulse, setIssuesExpandPulse] = useState(0)

  useEffect(() => {
    setRequestedSubtaskParentIds([])
  }, [projectId])

  const issueTreeData = useMemo(
    () =>
      buildProjectIssueTreeData(
        rootProjectIssues,
        subtasksRawByParent,
        issueOverrides
      ),
    [rootProjectIssues, subtasksRawByParent, issueOverrides]
  )

  const requestProjectSubtasks = useCallback((parentId: string) => {
    setRequestedSubtaskParentIds((prev) =>
      prev.includes(parentId) ? prev : [...prev, parentId]
    )
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      const t = issuesTableRef.current
      if (!t) return
      const next = JSON.stringify(t.getState().expanded)
      if (next !== issuesExpandedJsonRef.current) {
        issuesExpandedJsonRef.current = next
        setIssuesExpandPulse((p) => p + 1)
      }
    }, 120)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const t = issuesTableRef.current
    if (!t) return
    walkExpandedProjectIssueParents(t, (issueId) => {
      requestProjectSubtasks(issueId)
    })
  }, [issuesExpandPulse, issueTreeData, requestProjectSubtasks])

  const updateIssuePriority = useCallback(
    (issueId: string, priority: string) => {
      setIssueOverrides((prev) => ({
        ...prev,
        [issueId]: { ...prev[issueId], priority },
      }))
    },
    []
  )

  const updateIssueStatus = useCallback((issueId: string, status: string) => {
    setIssueOverrides((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], status },
    }))
    void apiUpdateIssue(issueId, { status }).catch((e) =>
      logError(e, 'ProjectDetailIssuesTab.updateIssueStatus')
    )
  }, [])

  const issueColumns = useMemo<ColumnDef<ProjectDetailIssueRow, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'title',
        header: 'Name',
        cell: ({ row }) => {
          const o = row.original
          if (o.__placeholder && o.parentIssueId) {
            const err = subtasksErrorByParent[o.parentIssueId]
            const loading = subtasksLoadingByParent[o.parentIssueId]
            const pad = { paddingLeft: row.depth * 16 }
            if (err) {
              return (
                <div className="min-w-0 max-w-full" style={pad}>
                  <Alert
                    variant="error"
                    placement="inline"
                    description={err}
                    className="w-full"
                  />
                </div>
              )
            }
            return (
              <Text variant="body3" color="color.text.subtle" style={pad}>
                {loading ? 'Loading…' : '—'}
              </Text>
            )
          }
          return (
            <Button
              buttonType="link"
              style={{ paddingLeft: row.depth * 16 }}
              onClick={() => {
                if (workspaceId && teamId) {
                  navigate(
                    `/workspace/${workspaceId}/team/${teamId}/issue/${row.original.id}`
                  )
                }
              }}
            >
              <Inline gap="100" align="center" fullWidth>
                {row.original.parentIssueId ? (
                  <Badge variant="default" size="small">
                    Subtask · {row.original.id}
                  </Badge>
                ) : (
                  <Text variant="caption1" color="color.text.subtle">
                    {row.original.id}
                  </Text>
                )}
                <Text variant="body2" truncate>
                  {row.original.title}
                </Text>
              </Inline>
            </Button>
          )
        },
      },
      {
        id: 'priority',
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) =>
          row.original.__placeholder ? null : (
            <div onClick={(e) => e.stopPropagation()}>
              <PrioritySelector
                value={row.original.priority}
                onChange={(priority) =>
                  updateIssuePriority(row.original.id, priority)
                }
                options={INLINE_PRIORITY_OPTIONS}
                placeholder="Not set"
              />
            </div>
          ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'List',
        cell: ({ row }) =>
          row.original.__placeholder ? null : (
            <div onClick={(e) => e.stopPropagation()}>
              <StatusSelector
                value={row.original.status}
                onChange={(status) =>
                  updateIssueStatus(row.original.id, status)
                }
                placeholder="Set status"
              />
            </div>
          ),
      },
      {
        id: 'date',
        accessorKey: 'dateLabel',
        header: 'Due date',
        cell: ({ row }) =>
          row.original.__placeholder ? null : (
            <Text variant="body3" color="color.text.subtle">
              {row.original.dateLabel}
            </Text>
          ),
      },
      {
        id: 'assignee',
        accessorKey: 'assignee',
        header: 'Assignee',
        cell: ({ row }) =>
          row.original.__placeholder ? null : row.original.assignee ? (
            <Avatar
              name={row.original.assigneeInitials || row.original.assignee.name}
              size="small"
            />
          ) : (
            <Text variant="body3" color="color.text.subtle">
              —
            </Text>
          ),
      },
    ],
    [
      workspaceId,
      teamId,
      navigate,
      updateIssuePriority,
      updateIssueStatus,
      subtasksErrorByParent,
      subtasksLoadingByParent,
    ]
  )

  return (
    <Box border padding="400">
      <Stack gap="300">
        <Inline align="center" justify="space-between" fullWidth>
          {issuesLoading ? (
            <Text variant="body3" color="color.text.subtle">
              Loading issues...
            </Text>
          ) : issuesError ? null : (
            <Badge size="small" variant="default">
              {`${allProjectIssues.length} issue${allProjectIssues.length === 1 ? '' : 's'}`}
            </Badge>
          )}
          {workspaceId && teamId ? (
            <Button
              variant="primary"
              onClick={() =>
                navigate(
                  `/workspace/${workspaceId}/team/${teamId}/issues/new`,
                  projectId ? { state: { projectId } } : undefined
                )
              }
            >
              Create new issue
            </Button>
          ) : null}
        </Inline>

        {issuesError ? (
          <Alert
            variant="error"
            placement="inline"
            description={issuesError}
            className="w-full"
          />
        ) : issuesLoading ? (
          <Text variant="body3" color="color.text.subtle">
            Loading...
          </Text>
        ) : rootProjectIssues.length === 0 ? (
          <Box border padding="400" fullWidth>
            <Stack align="center">
              <Text variant="body3" color="color.text.subtle">
                No issues in this project yet
              </Text>
            </Stack>
          </Box>
        ) : (
          <Table<ProjectDetailIssueRow>
            data={issueTreeData}
            columns={issueColumns}
            size="medium"
            searchable={false}
            columnFilterable={false}
            emptyMessage="No issues found"
            expandable
            getSubRows={(row) => row.subRows}
            headerContent={(table) => {
              issuesTableRef.current = table
              return null
            }}
          />
        )}
      </Stack>
    </Box>
  )
}
