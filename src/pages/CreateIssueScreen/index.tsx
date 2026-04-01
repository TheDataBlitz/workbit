import { useMutation, useQuery } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'

import { Stack as View } from '@design-system'
import { Alert } from '@thedatablitz/alert'
import { Box } from '@thedatablitz/box'
import { Button } from '@thedatablitz/button'
import { Dropdown } from '@thedatablitz/dropdown'
import { Inline } from '@thedatablitz/inline'
import { MarkdownEditor } from '@thedatablitz/markdown-editor'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { TextInput } from '@thedatablitz/text-input'
import { PageHeader } from '@thedatablitz/page-header'
import { createIssue, fetchWorkspaceTeams } from '../../api/client'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { workspaceTeamsPickerQueryKey } from '../../contexts/workspaceQueryKeys'
import { logError } from '../../utils/errorHandling'
import { createIssueScreenClasses as classes } from './styles/classes'
import type { RouteParams } from './types'
import {
  getCancelPath,
  getIssueDetailPath,
  getSummary,
  ISSUE_PROPERTY_CHIPS,
  toTeamOptions,
} from './utils/helpers'

type CreateIssueMutationVars = {
  workspaceId: string
  teamIdOptional: string | undefined
  title: string
  description: string | undefined
}

export function CreateIssueScreen() {
  const { workspaceId, teamId: teamIdFromUrl } = useParams<RouteParams>()
  const navigate = useNavigate()
  const { currentWorkspace, teams } = useWorkspace()
  const [teamId, setTeamId] = useState(teamIdFromUrl ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const isTeamScoped = Boolean(teamIdFromUrl)
  const effectiveTeamId = teamIdFromUrl ?? teamId
  const teamName = teams.find((team) => team.id === effectiveTeamId)?.name

  const teamsPickerQuery = useQuery({
    queryKey: workspaceTeamsPickerQueryKey(currentWorkspace?.id ?? ''),
    queryFn: async ({ queryKey }) => {
      const wid = queryKey[2]
      if (typeof wid !== 'string' || !wid) {
        throw new Error('Missing workspace id.')
      }
      return fetchWorkspaceTeams(wid)
    },
    enabled: Boolean(workspaceId && currentWorkspace && !isTeamScoped),
  })

  const teamsList = teamsPickerQuery.data ?? []

  const createIssueMutation = useMutation({
    mutationFn: (vars: CreateIssueMutationVars) =>
      createIssue(vars.teamIdOptional, {
        title: vars.title,
        description: vars.description,
        status: 'todo',
      }),
    onSuccess: (issue, vars) => {
      if (vars.teamIdOptional) {
        navigate(
          getIssueDetailPath(vars.workspaceId, vars.teamIdOptional, issue.id)
        )
      } else {
        navigate(`/workspace/${vars.workspaceId}/inbox`)
      }
    },
    onError: (e) => {
      logError(e, 'CreateIssue')
    },
  })

  const submitting = createIssueMutation.isPending

  const submitError =
    createIssueMutation.isError && createIssueMutation.error
      ? createIssueMutation.error instanceof Error
        ? createIssueMutation.error.message
        : 'Failed to create issue'
      : null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !workspaceId) return

    createIssueMutation.reset()
    const teamIdOptional =
      effectiveTeamId && effectiveTeamId.trim() ? effectiveTeamId : undefined

    createIssueMutation.mutate({
      workspaceId,
      teamIdOptional,
      title: title.trim(),
      description: description.trim() || undefined,
    })
  }

  const handleCancel = () => {
    if (!workspaceId) return
    navigate(getCancelPath(workspaceId, isTeamScoped, teamIdFromUrl))
  }

  if (!workspaceId || !currentWorkspace) return <div>Workspace not found.</div>

  const summary = getSummary(isTeamScoped, teamName, currentWorkspace.name)
  const teamOptions = toTeamOptions(teamsList ?? [])

  return (
    <View gap={4} className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6">
      <Inline align="flex-start" justify="space-between" gap="200" fullWidth>
        <div className="min-w-0 flex-1">
          <PageHeader title="New issue" subtitle={summary} />
        </div>
        <Button
          variant="glass"
          buttonType="icon"
          onClick={handleCancel}
          aria-label="Close"
          className="shrink-0 rounded-none"
        >
          <X size={18} strokeWidth={2} aria-hidden />
        </Button>
      </Inline>

      <Box border fullWidth className="rounded-none">
        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <Stack gap="400" padding="400">
            {!isTeamScoped && (
              <Stack gap="100" fullWidth>
                <div className="w-full min-w-0">
                  <Dropdown
                    options={teamOptions}
                    value={teamId}
                    onChange={(v) => setTeamId(v)}
                    placeholder="Select a team"
                    size="medium"
                    disabled={submitting || teamsPickerQuery.isPending}
                  />
                </div>
                <Text variant="caption2" color="color.text.subtle">
                  The team must have a project; the issue will be created under
                  that project.
                </Text>
              </Stack>
            )}

            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (!title.trim() || submitting) return
                formRef.current?.requestSubmit()
              }}
              placeholder="Issue title"
              disabled={submitting}
              autoFocus
              size="large"
              fullWidth
              aria-label="Issue title"
            />

            <div className={classes.chipsWrap}>
              {ISSUE_PROPERTY_CHIPS.map((chip) => (
                <button key={chip} type="button" className={classes.chip}>
                  {chip}
                </button>
              ))}
            </div>

            <Box
              border
              padding="200"
              fullWidth
              className="rounded-none min-w-0"
            >
              <MarkdownEditor
                value={description}
                onChange={setDescription}
                placeholder="Write a description, acceptance criteria, or notes..."
                minHeight={220}
                aria-label="Issue description"
              />
            </Box>

            {submitError ? (
              <Alert
                variant="error"
                placement="inline"
                description={submitError}
                className="w-full"
              />
            ) : null}

            <Inline justify="flex-end" gap="100" fullWidth wrap>
              <Button
                variant="glass"
                onClick={handleCancel}
                disabled={submitting}
                className="rounded-none"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!title.trim() || submitting}
                loading={submitting}
                className="rounded-none"
                onClick={() => formRef.current?.requestSubmit()}
              >
                Create issue
              </Button>
            </Inline>
          </Stack>
        </form>
      </Box>
    </View>
  )
}
