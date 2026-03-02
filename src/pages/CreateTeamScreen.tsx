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
} from '@design-system'
import { createTeam } from '../api/client'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { logError } from '../utils/errorHandling'

export function CreateTeamScreen() {
  const { workspaceId, teamId: teamIdFromUrl } = useParams<{
    workspaceId: string
    teamId?: string
  }>()
  const navigate = useNavigate()
  const { currentWorkspace, refreshTeamsAndProjects } = useWorkspace()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTeamScoped = Boolean(teamIdFromUrl)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId || !name.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      await createTeam({ workspaceId, name: name.trim() })
      await refreshTeamsAndProjects()
      if (isTeamScoped && teamIdFromUrl) {
        navigate(
          `/workspace/${workspaceId}/team/${teamIdFromUrl}/issues/active`
        )
      } else {
        navigate(`/workspace/${workspaceId}/workspace/teams`)
      }
    } catch (err) {
      logError(err, 'CreateTeam')
      setError(err instanceof Error ? err.message : 'Failed to create team')
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
        navigate(`/workspace/${workspaceId}/workspace/teams`)
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

  return (
    <Container maxWidth="600px">
      <Stack gap={4}>
        <PageHeader
          title="New team"
          summary={`Create a team in ${currentWorkspace.name}.`}
        />
        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text size="sm">Team name</Text>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team name"
                disabled={submitting}
                autoFocus
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
                disabled={!name.trim() || submitting}
              >
                {submitting ? 'Creating…' : 'Create team'}
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
