import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'

import { Alert } from '@thedatablitz/alert'
import { Avatar } from '@thedatablitz/avatar'
import { PageHeader } from '@thedatablitz/page-header'
import { Badge } from '@thedatablitz/badge'
import { MarkdownEditor } from '@thedatablitz/markdown-editor'
import { Modal } from '@thedatablitz/modal'
import { Tabs } from '@thedatablitz/tabs'
import { Text } from '@thedatablitz/text'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { TextInput } from '@thedatablitz/text-input'
import {
  Table,
  type ColumnDef,
  type ExpandedState,
  type OnChangeFn,
} from '@thedatablitz/table'
import { STATUS_OPTIONS } from '../../components/StatusSelector'
import {
  createIssue,
  fetchSubIssues,
  fetchTeamIssues,
  updateIssue as apiUpdateIssue,
  type ApiSubIssue,
} from '../../api/client'
import { countBy, getErrorMessage, logError } from '../../utils'
import { useFetch } from '../../hooks/useFetch'
import { MetaText, NameCol, PriorityInline, StatusInline } from './styles'
import type {
  IssueTabId,
  TeamIssueApiItem,
  TeamIssueOverrides,
  TeamIssueRow,
  TeamIssuesParams,
  TeamIssuesScreenProps,
} from './types'
import {
  CREATE_ISSUE_CHIPS,
  INLINE_PRIORITY_OPTIONS,
  buildTeamIssueTreeData,
  getIssueDetailPath,
  getIssuesTabPath,
  isValidTab,
  ISSUE_TABS,
  toIssueRows,
} from './utils/helpers'

function walkExpandedParentIds(
  table: TanStackTable<TeamIssueRow>,
  visit: (issueId: string) => void
) {
  const rec = (rows: Row<TeamIssueRow>[]) => {
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

export function TeamIssuesScreen({ teamName }: TeamIssuesScreenProps) {
  const { workspaceId, teamId, tab: tabParam } = useParams<TeamIssuesParams>()
  const navigate = useNavigate()
  const activeTab: IssueTabId = isValidTab(tabParam) ? tabParam : 'active'

  const { data: apiIssues, reload } = useFetch(
    () => (teamId ? fetchTeamIssues(teamId, activeTab) : Promise.resolve([])),
    [teamId, activeTab]
  )

  const [overrides, setOverrides] = useState<TeamIssueOverrides>({})
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [createMore, setCreateMore] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const createStatus = activeTab === 'backlog' ? 'backlog' : 'todo'

  const allIssueRows = useMemo(
    () => toIssueRows((apiIssues ?? []) as TeamIssueApiItem[], overrides),
    [apiIssues, overrides]
  )

  const rootIssueRows = useMemo(
    () => allIssueRows.filter((r) => !r.parentIssueId),
    [allIssueRows]
  )

  const [subtasksRaw, setSubtasksRaw] = useState<Record<string, ApiSubIssue[]>>(
    {}
  )
  const [subtasksLoading, setSubtasksLoading] = useState<
    Record<string, boolean>
  >({})
  const [subtasksError, setSubtasksError] = useState<
    Record<string, string | null>
  >({})

  const tableRef = useRef<TanStackTable<TeamIssueRow> | null>(null)
  const [expanded, setExpanded] = useState<ExpandedState>({})

  useEffect(() => {
    setSubtasksRaw({})
    setSubtasksLoading({})
    setSubtasksError({})
    setExpanded({})
  }, [teamId, activeTab])

  const issueTreeData = useMemo(
    () => buildTeamIssueTreeData(rootIssueRows, subtasksRaw, overrides),
    [rootIssueRows, subtasksRaw, overrides]
  )

  const subtasksRawRef = useRef(subtasksRaw)
  const subtasksLoadingRef = useRef(subtasksLoading)
  subtasksRawRef.current = subtasksRaw
  subtasksLoadingRef.current = subtasksLoading

  const requestSubtasks = useCallback((parentId: string) => {
    if (subtasksRawRef.current[parentId] !== undefined) return
    if (subtasksLoadingRef.current[parentId]) return
    setSubtasksLoading((l) => ({ ...l, [parentId]: true }))
    setSubtasksError((e) => ({ ...e, [parentId]: null }))
    fetchSubIssues(parentId)
      .then((list) => {
        setSubtasksRaw((s) => ({ ...s, [parentId]: list }))
      })
      .catch((err) => {
        logError(err, 'TeamIssues.fetchSubIssues')
        setSubtasksError((e) => ({
          ...e,
          [parentId]:
            err instanceof Error ? err.message : 'Failed to load subtasks',
        }))
        setSubtasksRaw((s) => ({ ...s, [parentId]: [] }))
      })
      .finally(() => {
        setSubtasksLoading((l) => ({ ...l, [parentId]: false }))
      })
  }, [])

  const onExpandedChange = useCallback<OnChangeFn<ExpandedState>>((updater) => {
    setExpanded((old) =>
      typeof updater === 'function' ? updater(old) : updater
    )
  }, [])

  useEffect(() => {
    const t = tableRef.current
    if (!t) return
    walkExpandedParentIds(t, (issueId) => {
      requestSubtasks(issueId)
    })
  }, [expanded, issueTreeData, requestSubtasks])

  const handleNavigateToIssue = useCallback(
    (issueId: string) => {
      if (workspaceId && teamId) {
        navigate(getIssueDetailPath(workspaceId, teamId, issueId))
      }
    },
    [workspaceId, teamId, navigate]
  )

  const updateIssuePriority = useCallback(
    (issueId: string, priority: string) => {
      setOverrides((prev) => ({
        ...prev,
        [issueId]: { ...prev[issueId], priority },
      }))
    },
    []
  )

  const updateIssueStatus = useCallback((issueId: string, status: string) => {
    setOverrides((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], status },
    }))
    void apiUpdateIssue(issueId, { status }).catch((e) =>
      logError(e, 'Update issue status')
    )
  }, [])

  const columns = useMemo<ColumnDef<TeamIssueRow, unknown>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'id',
        header: 'Name',
        cell: ({ row }) => {
          const o = row.original
          if (o.__placeholder && o.parentIssueId) {
            const err = subtasksError[o.parentIssueId]
            const loading = subtasksLoading[o.parentIssueId]
            return (
              <MetaText style={{ paddingLeft: row.depth * 16 }}>
                {err ?? (loading ? 'Loading…' : '—')}
              </MetaText>
            )
          }
          return (
            <button
              type="button"
              onClick={() => handleNavigateToIssue(row.original.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                margin: 0,
                color: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                paddingLeft: row.depth * 16,
              }}
            >
              <NameCol>
                {row.original.parentIssueId ? (
                  <Badge variant="default" size="small">
                    Subtask · {row.original.id}
                  </Badge>
                ) : (
                  <Badge variant="brand" size="small">
                    {row.original.id}
                  </Badge>
                )}
                <Text
                  variant="body2"
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {row.original.title}
                </Text>
              </NameCol>
            </button>
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
              <PriorityInline
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
              <StatusInline
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
        accessorKey: 'date',
        header: 'Due date',
        cell: ({ row }) =>
          row.original.__placeholder ? null : (
            <MetaText>{row.original.date}</MetaText>
          ),
      },
      {
        id: 'assignee',
        accessorKey: 'assignee',
        header: 'Assignee',
        cell: ({ row }) =>
          row.original.__placeholder ? null : row.original.assignee ? (
            <Avatar
              name={row.original.assigneeInitials || row.original.assignee}
              size="small"
            />
          ) : (
            <MetaText>—</MetaText>
          ),
      },
    ],
    [
      handleNavigateToIssue,
      subtasksError,
      subtasksLoading,
      updateIssuePriority,
      updateIssueStatus,
    ]
  )

  const handleTabChange = (id: string) => {
    if (workspaceId && teamId && isValidTab(id)) {
      navigate(getIssuesTabPath(workspaceId, teamId, id))
    }
  }

  const statusCounts = countBy(allIssueRows, (issue) => issue.status)

  const statusSummary = STATUS_OPTIONS.filter(
    (opt) => (statusCounts[opt.id] ?? 0) > 0
  ).map((opt) => ({
    count: statusCounts[opt.id],
    label: opt.label,
    icon: opt.icon,
  }))

  const handleCreateIssue = async () => {
    if (!teamId || !issueTitle.trim()) return

    setCreateError(null)
    setCreating(true)
    try {
      await createIssue(teamId, {
        title: issueTitle.trim(),
        description: issueDescription.trim() || undefined,
        status: createStatus,
      })
      await reload()
      setIssueTitle('')
      setIssueDescription('')
      if (!createMore) {
        setShowModal(false)
      }
    } catch (err) {
      logError(err, 'TeamIssues')
      setCreateError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  const handleOpenCreateModal = () => {
    setCreateError(null)
    setShowModal(true)
  }

  const handleCloseCreateModal = () => {
    if (creating) return
    setShowModal(false)
    setIssueTitle('')
    setIssueDescription('')
    setCreateMore(false)
  }

  return (
    <Stack gap="400">
      {createError ? (
        <Alert
          variant="error"
          placement="inline"
          description={createError}
          className="w-full"
        />
      ) : null}
      <PageHeader
        avatar={{
          name: 'Issues',
        }}
        title={teamName}
        subtitle="Issues for this team."
      >
        <Inline justify="flex-end">
          {statusSummary.map((part) => (
            <Badge
              key={part.label}
              icon={part.icon}
              size="medium"
              variant="default"
            >
              {part.count} - {part.label}
            </Badge>
          ))}
          <Button
            icon={<Plus size={16} />}
            variant="glass"
            onClick={handleOpenCreateModal}
          >
            New Issue
          </Button>
        </Inline>
      </PageHeader>

      <Tabs
        items={[...ISSUE_TABS]}
        value={activeTab}
        onChange={handleTabChange}
      />

      <Table<TeamIssueRow>
        data={issueTreeData}
        columns={columns}
        size="medium"
        searchable
        columnFilterable={false}
        emptyMessage="No issues found"
        expandable
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        getSubRows={(row) => row.subRows}
        headerContent={(table) => {
          tableRef.current = table
          return null
        }}
      />

      <Modal
        open={showModal}
        onClose={handleCloseCreateModal}
        title="New issue"
        size="large"
        footer={
          <Inline justify="flex-end" gap="200" fullWidth>
            <Button
              variant="danger"
              onClick={handleCloseCreateModal}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateIssue()}
              disabled={!issueTitle.trim() || creating}
            >
              {creating ? 'Creating…' : 'Create issue'}
            </Button>
          </Inline>
        }
      >
        <Stack gap="300">
          <TextInput
            id="create-issue-title"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            placeholder="Issue title"
            disabled={creating}
          />

          <Text variant="body3" color="color.text.subtle">
            Create in {createStatus === 'backlog' ? 'Backlog' : 'Active'}
            {createStatus === 'backlog' ? ' tab' : ' workflow'}.
          </Text>

          <Inline gap="100" wrap fullWidth>
            {CREATE_ISSUE_CHIPS.map((chip) => (
              <Badge key={chip} icon={<Plus size={12} />} size="small">
                {chip}
              </Badge>
            ))}
          </Inline>

          <MarkdownEditor
            value={issueDescription}
            onChange={(next) => {
              if (creating) return
              setIssueDescription(next)
            }}
            placeholder="Write a description, acceptance criteria, or notes..."
            minHeight={170}
            aria-label="Issue description"
          />
        </Stack>
      </Modal>
    </Stack>
  )
}
