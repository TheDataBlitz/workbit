import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert } from '@thedatablitz/alert'
import { Container, Stack, Flex } from '@design-system'
import { PageHeader } from '@thedatablitz/page-header'
import { TextInput } from '@thedatablitz/text-input'
import { Text } from '@thedatablitz/text'
import { createTeam } from '../../api/client'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { logError } from '../../utils/errorHandling'
import { labelStyle } from './styles'
import type { RouteParams } from './types'
import { getReturnPath, getSummary } from './utils/helpers'
import { Button } from '@thedatablitz/button'

export function CreateTeamScreen() {
  const { workspaceId, teamId: teamIdFromUrl } = useParams<RouteParams>()
  const navigate = useNavigate()
  const { currentWorkspace, refreshTeamsAndProjects } = useWorkspace()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTeamScoped = Boolean(teamIdFromUrl)

  const handleSubmit = async () => {
    if (!workspaceId || !name.trim()) return

    setError(null)
    setSubmitting(true)
    try {
      await createTeam({ workspaceId, name: name.trim() })
      await refreshTeamsAndProjects()
      navigate(getReturnPath(workspaceId, isTeamScoped, teamIdFromUrl))
    } catch (err) {
      logError(err, 'CreateTeam')
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (!workspaceId) return
    navigate(getReturnPath(workspaceId, isTeamScoped, teamIdFromUrl))
  }

  if (!workspaceId || !currentWorkspace) {
    return (
      <Container maxWidth="600px">
        <Text variant="body3">Workspace not found.</Text>
      </Container>
    )
  }

  return (
    <Container maxWidth="600px">
      <Stack gap={4}>
        <PageHeader
          title="New team"
          subtitle={getSummary(currentWorkspace.name)}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <Stack gap={4}>
            <div>
              <label style={labelStyle}>
                <Text variant="body3">Team name</Text>
              </label>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team name"
                disabled={submitting}
                autoFocus
              />
            </div>
            {error ? (
              <Alert
                variant="error"
                placement="inline"
                description={error}
                className="w-full"
              />
            ) : null}
            <Flex gap={2} justify="flex-start">
              <Button
                variant="primary"
                disabled={!name.trim() || submitting}
                onClick={() => void handleSubmit()}
              >
                {submitting ? 'Creating…' : 'Create team'}
              </Button>
              <Button variant="danger" onClick={handleCancel}>
                Cancel
              </Button>
            </Flex>
          </Stack>
        </form>
      </Stack>
    </Container>
  )
}
