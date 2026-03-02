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
} from '@design-system'
import { createProject, fetchWorkspaceTeams } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { logError } from '../utils/errorHandling'

export function CreateProjectScreen() {
  const { workspaceId, teamId: teamIdFromUrl } = useParams<{
    workspaceId: string
    teamId?: string
  }>()
  const navigate = useNavigate()
  const { currentWorkspace, teams, refreshTeamsAndProjects } = useWorkspace()
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState(teamIdFromUrl ?? '')
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
    if (!name.trim() || !effectiveTeamId) return
    setError(null)
    setSubmitting(true)
    try {
      await createProject({
        name: name.trim(),
        teamId: effectiveTeamId,
        status: 'Active',
      })
      await refreshTeamsAndProjects()
      if (isTeamScoped && workspaceId && teamIdFromUrl) {
        navigate(`/workspace/${workspaceId}/team/${teamIdFromUrl}/projects`)
      } else if (workspaceId) {
        navigate(`/workspace/${workspaceId}/workspace/projects`)
      }
    } catch (err) {
      logError(err, 'CreateProject')
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (workspaceId) {
      if (isTeamScoped && teamIdFromUrl) {
        navigate(`/workspace/${workspaceId}/team/${teamIdFromUrl}/projects`)
      } else {
        navigate(`/workspace/${workspaceId}/workspace/projects`)
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
      ? `Create a project for ${teamName}.`
      : `Create a project in ${currentWorkspace.name}.`

  return (
    <Container maxWidth="600px">
      <Stack gap={4}>
        <PageHeader title="New project" summary={summary} />
        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text size="sm">Project name</Text>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name"
                disabled={submitting}
                autoFocus
              />
            </div>
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
              </div>
            )}
            {error && (
              <div role="alert">
                <Text size="sm">{error}</Text>
              </div>
            )}
            <Flex gap={2} justify="flex-start">
              <Button
                type="submit"
                variant="primary"
                disabled={!name.trim() || !effectiveTeamId || submitting}
              >
                {submitting ? 'Creating…' : 'Create project'}
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
