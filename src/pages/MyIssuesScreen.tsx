import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  PageHeader,
  Stack,
  Text,
  Card,
  Flex,
  Avatar,
  Button,
  Modal,
  Input,
  Select,
} from '@design-system'
import { StatusSelector, PrioritySelector } from '../components'
import {
  fetchMyIssues,
  updateIssue as apiUpdateIssue,
  createIssue,
  fetchWorkspaceTeams,
} from '../api/client'
import { useFetch } from '../hooks/useFetch'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { formatDateTime } from '../utils/format'
import { logError } from '../utils/errorHandling'

export function MyIssuesScreen() {
  const { currentWorkspace } = useWorkspace()
  const { data, loading, error, reload } = useFetch(fetchMyIssues)
  const { data: teams } = useFetch(
    () =>
      currentWorkspace
        ? fetchWorkspaceTeams(currentWorkspace.id)
        : Promise.resolve([]),
    [currentWorkspace?.id]
  )
  const [overrides, setOverrides] = useState<
    Record<string, { status?: string; priority?: string }>
  >({})
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [issueTitle, setIssueTitle] = useState('')
  const [selectedTeam, setSelectedTeam] = useState('')

  const issues = (data ?? []).map((i) => ({
    ...i,
    date: i.date ? formatDateTime(i.date) : '—',
    status: overrides[i.id]?.status ?? i.status ?? 'todo',
    priority: overrides[i.id]?.priority ?? 'medium',
  }))

  const updateStatus = (issueId: string, status: string) => {
    setOverrides((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], status },
    }))
    void apiUpdateIssue(issueId, { status }).catch((e) =>
      logError(e, 'MyIssues')
    )
  }

  const updatePriority = (issueId: string, priority: string) => {
    setOverrides((prev) => ({
      ...prev,
      [issueId]: { ...prev[issueId], priority },
    }))
  }

  const handleCreateIssue = async () => {
    if (!issueTitle.trim()) return

    setCreating(true)
    try {
      const teamIdOptional =
        selectedTeam && selectedTeam.trim() ? selectedTeam : undefined
      await createIssue(teamIdOptional, { title: issueTitle, status: 'todo' })
      await reload()
      setShowModal(false)
      setIssueTitle('')
      setSelectedTeam('')
    } catch (err) {
      logError(err, 'MyIssues')
      alert(`Failed to create issue: ${err}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Stack gap={4}>
      <Flex align="center" justify="space-between">
        <PageHeader
          title="My issues"
          summary="Issues assigned to you across all teams."
        />
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <Plus size={16} />
          New Issue
        </Button>
      </Flex>
      {error && (
        <Text size="sm" muted>
          Failed to load issues: {error}
        </Text>
      )}
      {!loading && (
        <Stack gap={1}>
          {issues.map((issue) => (
            <Card key={issue.id}>
              <Flex align="center" gap={2}>
                <PrioritySelector
                  triggerVariant="icon"
                  value={issue.priority}
                  onChange={(p) => updatePriority(issue.id, p)}
                />
                <StatusSelector
                  triggerVariant="icon"
                  value={issue.status}
                  onChange={(s) => updateStatus(issue.id, s)}
                />
                <Text size="sm">{issue.id}</Text>
                <span style={{ flex: 1 }}>
                  <Text size="sm" as="span">
                    {issue.title}
                  </Text>
                </span>
                {issue.team && (
                  <Text size="xs" muted>
                    {issue.team.name}
                  </Text>
                )}
                {issue.project && (
                  <Text size="xs" muted>
                    · {issue.project.name}
                  </Text>
                )}
                {issue.assignee ? (
                  <Avatar name={issue.assignee.name} size={24} />
                ) : (
                  <span style={{ width: 24 }} />
                )}
                <Text size="xs" muted>
                  {issue.date}
                </Text>
              </Flex>
            </Card>
          ))}
          {issues.length === 0 && (
            <Text size="sm" muted>
              No issues assigned to you.
            </Text>
          )}
        </Stack>
      )}

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
          <div>
            <Text
              as="label"
              size="sm"
              weight="medium"
              style={{ display: 'block', marginBottom: '8px' }}
            >
              Team (optional)
            </Text>
            <Select
              value={selectedTeam}
              onChange={setSelectedTeam}
              options={[
                { value: '', label: 'No team' },
                ...(teams ?? []).map((team) => ({
                  value: team.id,
                  label: team.name,
                })),
              ]}
            />
          </div>
        </Stack>
      </Modal>
    </Stack>
  )
}
