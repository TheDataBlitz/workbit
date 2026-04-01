import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert } from '@thedatablitz/alert'
import { Box } from '@thedatablitz/box'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { PageHeader } from '@thedatablitz/page-header'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { TextInput } from '@thedatablitz/text-input'
import { createTeam } from '../../api/client'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { logError } from '../../utils/errorHandling'
import { labelStyle } from './styles'
import type { RouteParams } from './types'
import { getReturnPath, getSummary } from './utils/helpers'

const formShellClassName = 'w-full max-w-[600px] mx-auto px-4'

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
      <Box fullWidth className={formShellClassName}>
        <Text variant="body3">Workspace not found.</Text>
      </Box>
    )
  }

  return (
    <Box fullWidth className={formShellClassName}>
      <Stack gap="400">
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
          <Stack gap="400">
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
                fullWidth
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
            <Inline gap="200" justify="flex-start" fullWidth>
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
            </Inline>
          </Stack>
        </form>
      </Stack>
    </Box>
  )
}
