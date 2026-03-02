import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container,
  Stack,
  PageHeader,
  Text,
  Button,
  Input,
  Flex,
  Select,
  RichText,
} from '@design-system'
import { createIssue, fetchWorkspaceTeams } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { logError } from '../utils/errorHandling'

export function CreateIssueScreen() {
  const { workspaceId, teamId: teamIdFromUrl } = useParams<{
    workspaceId: string
    teamId?: string
  }>()
  const navigate = useNavigate()
  const { currentWorkspace, teams } = useWorkspace()
  const [teamId, setTeamId] = useState(teamIdFromUrl ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTeamScoped = Boolean(teamIdFromUrl)
  const effectiveTeamId = teamIdFromUrl ?? teamId
  const teamName = teams.find((t) => t.id === effectiveTeamId)?.name

  const { data: teamsList } = useFetch(
    () =>
      currentWorkspace && !isTeamScoped
        ? fetchWorkspaceTeams(currentWorkspace.id)
        : Promise.resolve([]),
    [currentWorkspace?.id, isTeamScoped]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      const teamIdOptional =
        effectiveTeamId && effectiveTeamId.trim() ? effectiveTeamId : undefined
      const issue = await createIssue(teamIdOptional, {
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'todo',
      })
      if (workspaceId) {
        if (teamIdOptional && isTeamScoped) {
          navigate(
            `/workspace/${workspaceId}/team/${teamIdOptional}/issue/${issue.id}`
          )
        } else if (teamIdOptional) {
          navigate(
            `/workspace/${workspaceId}/team/${teamIdOptional}/issue/${issue.id}`
          )
        } else {
          navigate(`/workspace/${workspaceId}/my-issues`)
        }
      }
    } catch (err) {
      logError(err, 'CreateIssue')
      setError(err instanceof Error ? err.message : 'Failed to create issue')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (workspaceId) {
      if (isTeamScoped && teamIdFromUrl) {
        navigate(
          `/workspace/${workspaceId}/team/${teamIdFromUrl}/issues/active`
        )
      } else {
        navigate(`/workspace/${workspaceId}/my-issues`)
      }
    }
  }

  if (!workspaceId || !currentWorkspace) {
    return (
      <Container maxWidth="600px">
        <Text>Workspace not found.</Text>
      </Container>
    )
  }

  const summary =
    isTeamScoped && teamName
      ? `Create an issue for ${teamName}.`
      : `Create an issue in ${currentWorkspace.name}. Choose a team that has a project.`

  return (
    <Container maxWidth="600px">
      <Stack gap={4}>
        <PageHeader title="New issue" summary={summary} />
        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            {!isTeamScoped && (
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <Text size="sm">Team</Text>
                </label>
                <Select
                  value={teamId}
                  onChange={setTeamId}
                  options={[
                    { value: '', label: 'Select a team' },
                    ...(teamsList ?? []).map((t) => ({
                      value: t.id,
                      label: t.name,
                    })),
                  ]}
                />
                <Text size="xs" muted as="p">
                  The team must have a project; the issue will be created under
                  that project.
                </Text>
              </div>
            )}
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text size="sm">Title</Text>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title"
                disabled={submitting}
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text size="sm">Description (optional)</Text>
              </label>
              <RichText
                value={description}
                onChange={setDescription}
                placeholder="Add a description… (bold, italic, lists)"
                disabled={submitting}
                minHeight={140}
              />
            </div>
            {error && (
              <div role="alert">
                <Text size="sm">{error}</Text>
              </div>
            )}
            <Flex gap={2} justify="flex-start">
              <Button
                type="submit"
                variant="primary"
                disabled={!title.trim() || submitting}
              >
                {submitting ? 'Creating…' : 'Create issue'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
            </Flex>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
