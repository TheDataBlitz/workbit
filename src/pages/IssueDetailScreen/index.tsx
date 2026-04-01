import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@thedatablitz/button'
import { Text } from '@thedatablitz/text'
import { TextEditor } from '@thedatablitz/text-editor'
import { Stack } from '@thedatablitz/stack'
import { Inline } from '@thedatablitz/inline'
import {
  LoadingState,
  ErrorState,
  IssueActivity,
  IssueProperties,
  SubIssues,
} from '../../components'
import { workspaceMembersQueryKey } from '../../contexts/workspaceQueryKeys'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../auth/AuthContext'
import {
  fetchIssue,
  updateIssue,
  fetchMembers,
  generateSubIssues,
} from '../../api/client'
import { formatDateTime, logError } from '../../utils'
import { stringToLexicalEditorState } from '../../utils/textEditorState'
import type { IssueDetailScreenProps } from './types'
import { Box } from '@thedatablitz/box'
import { useIssueDescriptionAutosave } from './hooks/useIssueDescriptionAutosave'

function issueDetailQueryKey(issueId: string) {
  return ['issue', issueId, 'detail'] as const
}

// ===== MAIN COMPONENT =====

export function IssueDetailScreen({
  issueId,
  teamId: teamIdProp,
  teamName,
  projectName,
}: IssueDetailScreenProps) {
  const { workspaceId, teamId } = useParams<{
    workspaceId: string
    teamId: string
  }>()
  const resolvedTeamId = teamId ?? teamIdProp
  const queryClient = useQueryClient()
  const { state: authState } = useAuth()
  const isAuthLoading = authState.status === 'loading'
  const userId =
    authState.status === 'authenticated' ? authState.session.user.id : null

  const [priority, setPriority] = useState('medium')
  const [generatingSubIssues, setGeneratingSubIssues] = useState(false)
  const { projects: workspaceProjects } = useWorkspace()
  const issueTeamId = workspaceProjects.find((p) => p.name === projectName)
    ?.team.id

  const issueQuery = useQuery({
    queryKey: issueDetailQueryKey(issueId),
    queryFn: async () => {
      try {
        return await fetchIssue(issueId)
      } catch (e) {
        logError(e, 'IssueDetailScreen.fetchIssue')
        throw e
      }
    },
    enabled: Boolean(issueId),
  })

  const membersQuery = useQuery({
    queryKey: workspaceMembersQueryKey(userId),
    queryFn: async () => {
      try {
        return await fetchMembers()
      } catch (e) {
        logError(e, 'IssueDetailScreen.fetchMembers')
        throw e
      }
    },
    enabled: !isAuthLoading && !!userId,
  })

  const issueData = issueQuery.data
  const loading = Boolean(issueId) && issueQuery.isPending
  const error =
    issueQuery.isError && issueQuery.error
      ? issueQuery.error instanceof Error
        ? issueQuery.error.message
        : 'Failed to load issue'
      : null
  const members = membersQuery.data ?? []

  const teamProjects = issueTeamId
    ? workspaceProjects.filter((p) => p.team.id === issueTeamId)
    : []

  const projectOptions = [
    { value: '', label: 'No project' },
    ...teamProjects.map((p) => ({ value: p.id, label: p.name })),
  ]

  const assigneeOptions = [
    { value: '', label: 'No assignee' },
    ...members.map((m) => ({ value: m.id, label: m.name })),
  ]

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateIssue(issueId, { status: newStatus })
      await queryClient.invalidateQueries({
        queryKey: issueDetailQueryKey(issueId),
      })
    } catch (e) {
      logError(e, 'Status update')
    }
  }

  const handleProjectChange = async (value: string) => {
    try {
      await updateIssue(issueId, { projectId: value === '' ? null : value })
      await queryClient.invalidateQueries({
        queryKey: issueDetailQueryKey(issueId),
      })
    } catch (e) {
      logError(e, 'Project update')
    }
  }

  const handleAssigneeChange = async (value: string) => {
    try {
      const member = members.find((m) => m.id === value)
      await updateIssue(issueId, {
        assigneeId: value === '' ? undefined : value,
        assigneeName: member?.name,
      })
      await queryClient.invalidateQueries({
        queryKey: issueDetailQueryKey(issueId),
      })
    } catch (e) {
      logError(e, 'Assignee update')
    }
  }

  const { saveDescription } = useIssueDescriptionAutosave({
    issueId,
    initialDescription: issueData?.description,
  })

  const handleBreakdownWork = async () => {
    if (generatingSubIssues) return
    setGeneratingSubIssues(true)
    try {
      await generateSubIssues(issueId)
      // Intentionally not rendering output yet; only trigger generation.
    } catch (e) {
      logError(e, 'Generate sub-issues')
    } finally {
      setGeneratingSubIssues(false)
    }
  }

  if (loading) {
    return (
      <Box fullWidth>
        <Stack fullWidth padding="300">
          <LoadingState message="Loading issue details..." fullHeight />
        </Stack>
      </Box>
    )
  }

  if (error || !issueData) {
    return (
      <Box fullWidth>
        <Stack fullWidth padding="300">
          <ErrorState error={error} message="Issue not found" fullHeight />
        </Stack>
      </Box>
    )
  }

  const issue = {
    id: issueData.id,
    title: issueData.title,
    createdAt: formatDateTime(issueData.date),
    status: issueData.status,
    project: issueData.project?.name || projectName || 'No Project',
    description: stringToLexicalEditorState(issueData.description),
  }

  const teamHref =
    workspaceId && resolvedTeamId
      ? `/workspace/${workspaceId}/team/${resolvedTeamId}/issues/active`
      : workspaceId
        ? `/workspace/${workspaceId}/workspace/teams`
        : '#'
  const projectHref =
    workspaceId && resolvedTeamId
      ? `/workspace/${workspaceId}/team/${resolvedTeamId}/projects`
      : workspaceId
        ? `/workspace/${workspaceId}/workspace/projects`
        : '#'
  const issueHref =
    workspaceId && resolvedTeamId
      ? `/workspace/${workspaceId}/team/${resolvedTeamId}/issue/${issue.id}`
      : '#'

  return (
    <Box fullWidth border>
      <Stack fullWidth>
        <Stack fullWidth padding="200" gap="150">
          <Inline align="center" gap="050" wrap fullWidth>
            <Link to={teamHref} className="hover:underline">
              <Text as="span" variant="body3" color="color.text.subtle">
                {teamName}
              </Text>
            </Link>
            <Text as="span" variant="body3" color="color.text.subtle">
              /
            </Text>
            <Link to={projectHref} className="hover:underline">
              <Text as="span" variant="body3" color="color.text.subtle">
                {issue.project}
              </Text>
            </Link>
            <Text as="span" variant="body3" color="color.text.subtle">
              /
            </Text>
            <Link to={issueHref} className="hover:underline">
              <Text as="span" variant="body3" color="color.text.subtle">
                {issue.id}
              </Text>
            </Link>
          </Inline>
          <IssueProperties
            status={issue.status}
            onStatusChange={handleStatusChange}
            priority={priority}
            onPriorityChange={setPriority}
            assigneeValue={issueData?.assignee?.id ?? ''}
            assigneeOptions={assigneeOptions}
            onAssigneeChange={handleAssigneeChange}
            projectValue={issueData?.project?.id ?? ''}
            projectOptions={projectOptions}
            onProjectChange={handleProjectChange}
          />
        </Stack>

        <Stack fullWidth padding="200" gap="100">
          <Inline fullWidth justify="space-between" align="center" gap="100">
            <Text as="h1" variant="heading3">
              {issue.title}
            </Text>
            <Button
              variant="ai"
              disabled={generatingSubIssues}
              onClick={() => void handleBreakdownWork()}
            >
              Breakdown the work
            </Button>
          </Inline>

          <Box fullWidth>
            <TextEditor
              key={issueId}
              defaultEditorState={issue.description}
              onChange={saveDescription}
              placeholder="Add description…"
              autoFocus={false}
            />
          </Box>

          <SubIssues parentIssueId={issueId} />

          <IssueActivity entityId={issueId} />
        </Stack>
      </Stack>
    </Box>
  )
}
