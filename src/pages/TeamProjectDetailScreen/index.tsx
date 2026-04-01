import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Row, Table as TanStackTable } from '@tanstack/react-table'
import { Box } from '@thedatablitz/box'
import { Badge } from '@thedatablitz/badge'
import { Alert } from '@thedatablitz/alert'
import { Banner } from '@thedatablitz/banner'
import { Breadcrumbs, BreadcrumbsItem } from '@thedatablitz/breadcrumb'
import { Button } from '@thedatablitz/button'
import { Card, CardContent, CardFooter } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Table, type ColumnDef } from '@thedatablitz/table'
import { Tabs } from '@thedatablitz/tabs'
import { Text } from '@thedatablitz/text'
import { Avatar } from '@thedatablitz/avatar'
import {
  StatusUpdateComposer,
  ActivitySection,
  PropertiesSection,
  ProjectUpdateHighlightCard,
  UpdatesTree,
  DecisionTab,
  PrioritySelector,
  StatusSelector,
} from '../../components'
import type {
  StatusUpdateCardData,
  UpdateItem,
  ProjectStatus,
  ActivityItem,
} from '../../components'
import { noop } from '../../utils/noop'
import { formatDateTime } from '../../utils/format'
import { logError } from '../../utils/errorHandling'
import {
  fetchSubIssues,
  fetchTeamProject,
  fetchTeamProjectIssues,
  fetchStatusUpdateComments,
  postStatusUpdate,
  postComment,
  patchProject,
  runProjectAgent,
  updateIssue as apiUpdateIssue,
  fetchProjectDocuments,
} from '../../api/client'
import type {
  ApiProjectProperties,
  ApiProjectDocumentSummary,
  ApiSubIssue,
} from '../../api/client'
import { useFetch } from '../../hooks/useFetch'
import type {
  ProjectDetailDocumentRow,
  ProjectDetailIssueRow,
  TeamProjectDetailScreenProps,
} from './types'
import {
  DEFAULT_STATUS,
  DEFAULT_PRIORITY,
  INLINE_PRIORITY_OPTIONS,
  apiUpdateToCard,
  buildProjectIssueTreeData,
} from './utils/helpers'
import { Bot, Plus } from 'lucide-react'
import { useProjectPeopleProperties } from './hooks/useProjectPeopleProperties'

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

function mapStatusCommentsToUpdateItems(params: {
  updateId: string
  status: ProjectStatus
  comments: Array<{
    id: string
    authorName: string
    timestamp: string
    content: string
    parentCommentId: string | null
  }>
}): UpdateItem[] {
  const commentsById = new Map(params.comments.map((c) => [c.id, c]))
  return params.comments.map((comment) => {
    const parentId =
      comment.parentCommentId && commentsById.has(comment.parentCommentId)
        ? `${params.updateId}:comment:${comment.parentCommentId}`
        : params.updateId
    return {
      id: `${params.updateId}:comment:${comment.id}`,
      kind: 'comment',
      updateId: params.updateId,
      parentId,
      content: comment.content,
      author: comment.authorName,
      timestamp: formatDateTime(comment.timestamp),
      status: params.status,
      comments: [],
      reactions: {},
    }
  })
}

export function TeamProjectDetailScreen({
  projectName,
  teamId,
  initialTab = 'overview',
  documentationMode,
}: TeamProjectDetailScreenProps) {
  type ProjectDetailTab =
    | 'overview'
    | 'updates'
    | 'issues'
    | 'documentation'
    | 'decisions'
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const navigate = useNavigate()

  const [updates, setUpdates] = useState<StatusUpdateCardData[]>([])
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [properties, setProperties] = useState<ApiProjectProperties | null>(
    null
  )
  const [commentsByUpdateId, setCommentsByUpdateId] = useState<
    Record<string, UpdateItem[]>
  >({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>(initialTab)
  const [documents, setDocuments] = useState<ApiProjectDocumentSummary[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [projectDescription, setProjectDescription] = useState('')
  const [agentRunningMode, setAgentRunningMode] = useState<
    'single' | 'planner_worker' | null
  >(null)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [agentOutcome, setAgentOutcome] = useState<{
    summary: string
    finishedReason?: string
    plan?: string
    mode: string
  } | null>(null)
  const [issueOverrides, setIssueOverrides] = useState<
    Record<string, { status?: string; priority?: string }>
  >({})
  const { teamMembers, handleLeadChange, handleMemberIdsChange } =
    useProjectPeopleProperties({
      teamId,
      setProperties,
    })

  const { data: projectIssues, loading: issuesLoading } = useFetch(
    () =>
      teamId
        ? fetchTeamProjectIssues(teamId, 'all', projectId)
        : Promise.resolve([]),
    [teamId, projectId]
  )
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

  const [subtasksRawByParent, setSubtasksRawByParent] = useState<
    Record<string, ApiSubIssue[]>
  >({})
  const [subtasksLoadingByParent, setSubtasksLoadingByParent] = useState<
    Record<string, boolean>
  >({})
  const [subtasksErrorByParent, setSubtasksErrorByParent] = useState<
    Record<string, string | null>
  >({})

  const issuesTableRef = useRef<TanStackTable<ProjectDetailIssueRow> | null>(
    null
  )
  const issuesExpandedJsonRef = useRef('')
  const [issuesExpandPulse, setIssuesExpandPulse] = useState(0)

  useEffect(() => {
    setSubtasksRawByParent({})
    setSubtasksLoadingByParent({})
    setSubtasksErrorByParent({})
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

  const subtasksRawRef = useRef(subtasksRawByParent)
  const subtasksLoadingRef = useRef(subtasksLoadingByParent)
  subtasksRawRef.current = subtasksRawByParent
  subtasksLoadingRef.current = subtasksLoadingByParent

  const requestProjectSubtasks = useCallback((parentId: string) => {
    if (subtasksRawRef.current[parentId] !== undefined) return
    if (subtasksLoadingRef.current[parentId]) return
    setSubtasksLoadingByParent((l) => ({ ...l, [parentId]: true }))
    setSubtasksErrorByParent((e) => ({ ...e, [parentId]: null }))
    fetchSubIssues(parentId)
      .then((list) => {
        setSubtasksRawByParent((s) => ({ ...s, [parentId]: list }))
      })
      .catch((err) => {
        logError(err, 'TeamProjectDetail.fetchSubIssues')
        setSubtasksErrorByParent((e) => ({
          ...e,
          [parentId]:
            err instanceof Error ? err.message : 'Failed to load subtasks',
        }))
        setSubtasksRawByParent((s) => ({ ...s, [parentId]: [] }))
      })
      .finally(() => {
        setSubtasksLoadingByParent((l) => ({ ...l, [parentId]: false }))
      })
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

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'updates', label: 'Updates' },
    { id: 'issues', label: 'Issues' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'decisions', label: 'Decisions' },
  ]

  const updatesTreeItems: UpdateItem[] = updates.map((update) => ({
    id: update.id,
    kind: 'update',
    updateId: update.id,
    parentId: null,
    content: update.content,
    author: update.authorName,
    timestamp: update.timestamp,
    status: update.status,
    comments: commentsByUpdateId[update.id] ?? [],
  }))

  const featuredUpdate = updatesTreeItems[0]

  useEffect(() => {
    if (!teamId) return
    setLoading(true)
    fetchTeamProject(teamId)
      .then((data) => {
        if (!data.project) {
          setUpdates([])
          setCommentsByUpdateId({})
          setActivity([])
          setProjectDescription('')
          setProperties(null)
          return
        }

        const nextUpdates =
          data.project.statusUpdates.nodes.map(apiUpdateToCard)
        setUpdates(nextUpdates)

        if (nextUpdates.length > 0) {
          void Promise.all(
            nextUpdates.map(async (update) => {
              const comments = await fetchStatusUpdateComments(
                teamId,
                update.id
              )
              const mapped = mapStatusCommentsToUpdateItems({
                updateId: update.id,
                status: update.status,
                comments,
              })
              return [update.id, mapped] as const
            })
          )
            .then((entries) => {
              setCommentsByUpdateId(Object.fromEntries(entries))
            })
            .catch((e) => logError(e, 'TeamProjectDetail.commentsLoad'))
        } else {
          setCommentsByUpdateId({})
        }

        setActivity(
          data.project.activity.map((item) => ({
            ...item,
            date: formatDateTime(item.date),
          }))
        )
        setProjectDescription(data.project.description ?? '')
        setProperties(data.project.properties)
      })
      .catch((e) => logError(e, 'TeamProjectDetail'))
      .finally(() => setLoading(false))
  }, [teamId])

  useEffect(() => {
    if (!projectId || documentationMode !== 'list') return
    setDocsLoading(true)
    setDocsError(null)
    fetchProjectDocuments(projectId)
      .then(setDocuments)
      .catch((e) => {
        logError(e, 'TeamProjectDetail.fetchProjectDocuments')
        setDocsError((e as Error).message)
      })
      .finally(() => setDocsLoading(false))
  }, [projectId, documentationMode])

  const handlePostUpdate = (content: string, status: ProjectStatus) => {
    if (!teamId) return
    void postStatusUpdate(
      teamId,
      content,
      status,
      projectId ? { projectId } : undefined
    )
      .then((update) =>
        setUpdates((prev) => [apiUpdateToCard(update), ...prev])
      )
      .catch((e) => logError(e, 'TeamProjectDetail'))
  }

  const handleAddComment = async (item: UpdateItem, content: string) => {
    if (!teamId) return

    const updateId = item.updateId
    await postComment(
      teamId,
      updateId,
      content,
      item.kind === 'comment'
        ? { parentCommentId: item.id.replace(`${updateId}:comment:`, '') }
        : undefined
    )
      .then((result) => {
        const createdItems = mapStatusCommentsToUpdateItems({
          updateId,
          status: item.status ?? 'on-track',
          comments: result.comments,
        })

        setCommentsByUpdateId((prev) => ({
          ...prev,
          [updateId]: [...(prev[updateId] ?? []), ...createdItems],
        }))

        setUpdates((prev) =>
          prev.map((update) =>
            update.id === updateId
              ? {
                  ...update,
                  commentCount:
                    (update.commentCount ?? 0) + createdItems.length,
                }
              : update
          )
        )
      })
      .catch((e) => {
        logError(e, 'TeamProjectDetail.postComment')
        throw e
      })
  }

  const handleStatusChange = (status: string) => {
    if (!teamId) return
    setProperties((prev) => (prev ? { ...prev, status } : null))
    void patchProject(teamId, { status }).catch((e) =>
      logError(e, 'TeamProjectDetail')
    )
  }

  const handlePriorityChange = (priority: string) => {
    if (!teamId) return
    setProperties((prev) => (prev ? { ...prev, priority } : null))
    void patchProject(teamId, { priority }).catch((e) =>
      logError(e, 'TeamProjectDetail')
    )
  }

  const handleRunAgent = (mode: 'single' | 'planner_worker') => {
    if (!projectId) return
    setAgentRunningMode(mode)
    setAgentError(null)
    setAgentOutcome(null)
    runProjectAgent(projectId, { mode })
      .then((out) => {
        setAgentOutcome({
          summary: out.summary,
          finishedReason: out.finishedReason,
          plan: out.plan,
          mode: out.mode,
        })
      })
      .catch((e) => {
        logError(e, 'TeamProjectDetail.runProjectAgent')
        setAgentError((e as Error).message)
      })
      .finally(() => setAgentRunningMode(null))
  }

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
      logError(e, 'TeamProjectDetail.updateIssueStatus')
    )
  }, [])

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
            return (
              <Text
                variant="body3"
                color="color.text.subtle"
                style={{ paddingLeft: row.depth * 16 }}
              >
                {err ?? (loading ? 'Loading…' : '—')}
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

  if (loading) {
    return (
      <Inline align="flex-start" gap="400" fullWidth wrap={false}>
        <Box border padding="400" fullWidth>
          <Text variant="body3" color="color.text.subtle">
            Loading project...
          </Text>
        </Box>
        <Box border padding="300" fullWidth />
      </Inline>
    )
  }

  return (
    <>
      <Inline align="flex-start" gap="400" fullWidth wrap={false}>
        <Stack fullWidth gap="200">
          <Breadcrumbs separator=">">
            <BreadcrumbsItem text="Projects" />
            <BreadcrumbsItem text={projectName} current />
          </Breadcrumbs>

          <Tabs
            items={tabs}
            value={activeTab}
            onChange={(nextTab) => {
              setActiveTab(nextTab as ProjectDetailTab)
              if (!workspaceId || !teamId || !projectId) return
              if (nextTab === 'documentation') {
                navigate(
                  `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}/documentation`
                )
                return
              }
              if (activeTab === 'documentation') {
                navigate(
                  `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}`
                )
              }
            }}
          />

          {activeTab === 'overview' && (
            <Box border padding="400">
              <Stack gap="400">
                <Inline align="flex-start" justify="space-between" fullWidth>
                  <Stack gap="200">
                    <Inline align="center" gap="100">
                      <Avatar name={projectName[0]?.toUpperCase() ?? 'P'} />
                      <Text variant="heading4">{projectName}</Text>
                    </Inline>
                    {projectDescription ? (
                      <Text variant="body2" color="color.text.subtle">
                        {projectDescription}
                      </Text>
                    ) : null}
                    <Inline fullWidth wrap gap="100">
                      <Button
                        icon={<Plus size={16} />}
                        variant="warning"
                        size="small"
                        onClick={() => {
                          if (workspaceId && teamId && projectId) {
                            navigate(
                              `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}/documentation/new`
                            )
                          }
                        }}
                      >
                        Add document or link
                      </Button>
                      <Button
                        variant="glass"
                        size="small"
                        icon={<Bot size={16} />}
                        disabled={agentRunningMode !== null || !projectId}
                        onClick={() => handleRunAgent('single')}
                      >
                        {agentRunningMode === 'single'
                          ? 'Running…'
                          : 'Run agent'}
                      </Button>
                      <Button
                        variant="glass"
                        size="small"
                        icon={<Bot size={16} />}
                        disabled={agentRunningMode !== null || !projectId}
                        onClick={() => handleRunAgent('planner_worker')}
                      >
                        {agentRunningMode === 'planner_worker'
                          ? 'Running…'
                          : 'Plan & run'}
                      </Button>
                    </Inline>
                  </Stack>
                </Inline>

                {agentError ? (
                  <Alert
                    variant="error"
                    placement="inline"
                    description={agentError}
                    className="w-full"
                  />
                ) : null}
                {agentOutcome ? (
                  <Card fullWidth variant="default" size="small">
                    <CardContent>
                      <Stack gap="200">
                        <Text variant="caption2" color="color.text.subtle">
                          Agent · {agentOutcome.mode}
                          {agentOutcome.finishedReason
                            ? ` · ${agentOutcome.finishedReason}`
                            : ''}
                        </Text>
                        {agentOutcome.plan ? (
                          <>
                            <Text variant="heading6">Plan</Text>
                            <Text
                              variant="body3"
                              paragraphSpacing
                              style={{ whiteSpace: 'pre-wrap' }}
                            >
                              {agentOutcome.plan}
                            </Text>
                          </>
                        ) : null}
                        <Text variant="heading6">Summary</Text>
                        <Text
                          variant="body3"
                          paragraphSpacing
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {agentOutcome.summary}
                        </Text>
                      </Stack>
                    </CardContent>
                    <CardFooter>
                      <Button
                        buttonType="link"
                        size="small"
                        onClick={() => {
                          setAgentOutcome(null)
                          setAgentError(null)
                        }}
                      >
                        Dismiss
                      </Button>
                    </CardFooter>
                  </Card>
                ) : null}

                <Stack gap="200">
                  {updates.length === 0 ? (
                    <Banner
                      size="small"
                      variant="default"
                      title="Write the first project update to get started"
                    />
                  ) : (
                    <>
                      <ProjectUpdateHighlightCard
                        update={featuredUpdate}
                        onAddComment={handleAddComment}
                      />
                      <UpdatesTree
                        updates={updatesTreeItems}
                        enableSearch={false}
                        onAddComment={handleAddComment}
                        onReact={noop}
                      />
                    </>
                  )}

                  <StatusUpdateComposer
                    placeholder="Write first project update"
                    onPost={handlePostUpdate}
                    onChooseFile={noop}
                    onCreateDocument={noop}
                    onAddLink={noop}
                  />
                </Stack>

                <ActivitySection items={activity} />
              </Stack>
            </Box>
          )}

          {activeTab === 'updates' && (
            <Box border padding="400">
              <Stack gap="300">
                <UpdatesTree
                  updates={updatesTreeItems}
                  enableSearch={false}
                  onAddComment={handleAddComment}
                  onReact={noop}
                />
                <StatusUpdateComposer
                  placeholder="Write a project update..."
                  onPost={handlePostUpdate}
                  onChooseFile={noop}
                  onCreateDocument={noop}
                  onAddLink={noop}
                />
              </Stack>
            </Box>
          )}

          {activeTab === 'issues' && (
            <Box border padding="400">
              <Stack gap="300">
                <Inline align="center" justify="space-between" fullWidth>
                  {issuesLoading ? (
                    <Text variant="body3" color="color.text.subtle">
                      Loading issues...
                    </Text>
                  ) : (
                    <Badge size="small" variant="default">
                      {`${allProjectIssues.length} issue${allProjectIssues.length === 1 ? '' : 's'}`}
                    </Badge>
                  )}
                  {workspaceId && teamId && (
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
                  )}
                </Inline>

                {issuesLoading ? (
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
          )}

          {activeTab === 'documentation' && documentationMode === 'list' && (
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

                {docsError ? (
                  <Alert
                    variant="error"
                    placement="inline"
                    description={docsError}
                    className="w-full"
                  />
                ) : null}

                {docsLoading ? (
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
          )}

          {activeTab === 'decisions' && projectId && (
            <DecisionTab
              projectId={projectId}
              issues={allProjectIssues.map((issue) => ({
                id: issue.id,
                title: issue.title,
              }))}
              isActive
            />
          )}
        </Stack>

        <Stack gap="200" className="max-w-[300px]" fullWidth>
          <Box>
            <Text variant="heading6">Other Details</Text>
          </Box>
          <Box border padding="200">
            <Text variant="heading7">Properties</Text>
            <PropertiesSection
              key={`${properties?.status}-${properties?.priority}-${properties?.memberIds?.join(',') ?? ''}`}
              contentOnly
              defaultStatus={properties?.status}
              defaultPriority={properties?.priority}
              defaultLeadId={
                typeof properties?.leadId === 'string'
                  ? properties.leadId
                  : undefined
              }
              defaultMemberIds={
                Array.isArray(properties?.memberIds)
                  ? properties.memberIds.filter(
                      (memberId): memberId is string =>
                        typeof memberId === 'string'
                    )
                  : []
              }
              teamMembers={teamMembers}
              defaultStartDate={
                properties?.startDate
                  ? new Date(properties.startDate)
                  : undefined
              }
              defaultEndDate={
                properties?.endDate ? new Date(properties.endDate) : undefined
              }
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onLeadChange={handleLeadChange}
              onMemberIdsChange={handleMemberIdsChange}
            />
          </Box>

          <Box border padding="200">
            <Inline align="center" justify="space-between" fullWidth>
              <Text variant="heading7">Activity</Text>
              <Button buttonType="link" size="small" onClick={noop}>
                See all
              </Button>
            </Inline>
            {activity.length > 0 ? (
              <Text variant="body3" color="color.text.subtle">
                {activity.length} recent activit
                {activity.length === 1 ? 'y' : 'ies'}
              </Text>
            ) : (
              <Text variant="body3" color="color.text.subtle">
                No activity yet
              </Text>
            )}
          </Box>
        </Stack>
      </Inline>
    </>
  )
}
