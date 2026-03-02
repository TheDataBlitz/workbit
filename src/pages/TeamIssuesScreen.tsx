import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Plus } from 'lucide-react'
import {
  PageHeader,
  Text,
  Avatar,
  Card,
  Flex,
  Stack,
  Tabs,
  Button,
  Modal,
  Input,
} from '@design-system'
import { StatusSelector, PrioritySelector } from '../components'
import { STATUS_OPTIONS } from '../components/StatusSelector'
import type { StatusOption } from '../components'
import {
  fetchTeamIssues,
  updateIssue as apiUpdateIssue,
  createIssue,
} from '../api/client'
import { useFetch } from '../hooks/useFetch'
import { formatDateTime, logError, countBy } from '../utils'

const ISSUE_TAB_IDS = ['all', 'active', 'backlog'] as const
type IssueTabId = (typeof ISSUE_TAB_IDS)[number]

const ClickableCardWrapper = styled.div`
  cursor: pointer;
  transition: transform 0.15s;
  &:hover {
    transform: translateY(-1px);
  }
  > * {
    transition: background 0.15s;
  }
  &:hover > * {
    background: ${(p) => p.theme.colors.surfaceHover};
  }
`

function isValidTab(tab: string | undefined): tab is IssueTabId {
  return tab != null && ISSUE_TAB_IDS.includes(tab as IssueTabId)
}

type Props = { teamName: string }

export function TeamIssuesScreen({ teamName }: Props) {
  const {
    workspaceId,
    teamId,
    tab: tabParam,
  } = useParams<{
    workspaceId: string
    teamId: string
    tab: string
  }>()
  const navigate = useNavigate()
  const activeTab = isValidTab(tabParam) ? tabParam : 'active'

  const { data: apiIssues, reload } = useFetch(
    () => (teamId ? fetchTeamIssues(teamId, activeTab) : Promise.resolve([])),
    [teamId, activeTab]
  )

  // local overrides for optimistic status / priority (priority not in API)
  const [overrides, setOverrides] = useState<
    Record<string, { status?: string; priority?: string }>
  >({})
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')

  const issues = (apiIssues ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    assignee: i.assignee?.name ?? '',
    date: formatDateTime(i.date),
    status: overrides[i.id]?.status ?? i.status ?? 'todo',
    priority: overrides[i.id]?.priority ?? 'medium',
  }))

  const updateIssueStatus = (issueId: string, status: string) => {
    setOverrides((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], status },
    }))
    void apiUpdateIssue(issueId, { status }).catch((e) =>
      logError(e, 'Update issue status')
    )
  }

  const updateIssuePriority = (issueId: string, priority: string) => {
    setOverrides((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], priority },
    }))
  }

  const handleTabChange = (id: string) => {
    if (workspaceId && teamId && isValidTab(id)) {
      navigate(`/workspace/${workspaceId}/team/${teamId}/issues/${id}`)
    }
  }

  const statusCounts = countBy(issues, (issue) => issue.status ?? 'todo')

  const statusSummary = STATUS_OPTIONS.filter(
    (opt: StatusOption) => (statusCounts[opt.id] ?? 0) > 0
  ).map((opt: StatusOption) => `${statusCounts[opt.id]} ${opt.label}`)

  const handleCreateIssue = async () => {
    if (!teamId || !issueTitle.trim()) return

    setCreating(true)
    try {
      await createIssue(teamId, { title: issueTitle, status: 'todo' })
      await reload()
      setShowModal(false)
      setIssueTitle('')
    } catch (err) {
      logError(err, 'TeamIssues')
      alert(`Failed to create issue: ${err}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Stack gap={4}>
      <Flex align="center" justify="space-between">
        <PageHeader title={teamName} />
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          New Issue
        </Button>
      </Flex>
      <Flex align="center" gap={2}>
        <Tabs
          tabs={[
            { id: 'all', label: 'All issues' },
            { id: 'active', label: 'Active' },
            { id: 'backlog', label: 'Backlog' },
          ]}
          activeId={activeTab}
          onChange={handleTabChange}
        />
      </Flex>

      <Flex align="center" gap={2} wrap>
        {statusSummary.map((part: string, i: number) => (
          <Flex key={i} align="center" gap={1}>
            {i > 0 && (
              <Text size="sm" muted>
                ·
              </Text>
            )}
            <Text size="sm" muted>
              {part}
            </Text>
          </Flex>
        ))}
      </Flex>

      <Stack gap={1}>
        {issues.map((issue) => (
          <ClickableCardWrapper
            key={issue.id}
            onClick={() =>
              navigate(
                `/workspace/${workspaceId}/team/${teamId}/issue/${issue.id}`
              )
            }
          >
            <Card>
              <Flex align="center" gap={2}>
                <div onClick={(e) => e.stopPropagation()}>
                  <PrioritySelector
                    triggerVariant="icon"
                    value={issue.priority ?? 'medium'}
                    onChange={(priority) =>
                      updateIssuePriority(issue.id, priority)
                    }
                  />
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <StatusSelector
                    triggerVariant="icon"
                    value={issue.status ?? 'todo'}
                    onChange={(status) => updateIssueStatus(issue.id, status)}
                  />
                </div>
                <Text size="sm">{issue.id}</Text>
                <span style={{ flex: 1 }}>
                  <Text size="sm" as="span">
                    {issue.title}
                  </Text>
                </span>
                {issue.assignee ? (
                  <Avatar name={issue.assignee} size={24} />
                ) : (
                  <span style={{ width: 24 }} />
                )}
                <Text size="xs" muted>
                  {issue.date}
                </Text>
              </Flex>
            </Card>
          </ClickableCardWrapper>
        ))}
      </Stack>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Issue"
        primaryLabel="Create"
        onPrimary={handleCreateIssue}
        secondaryLabel="Cancel"
        onSecondary={() => setShowModal(false)}
      >
        <Stack gap={3}>
          <div>
            <Text
              as="label"
              size="sm"
              weight="medium"
              style={{ display: 'block', marginBottom: '8px' }}
            >
              Issue Title
            </Text>
            <Input
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="Enter issue title"
              disabled={creating}
            />
          </div>
        </Stack>
      </Modal>
    </Stack>
  )
}
