import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Alert } from '@thedatablitz/alert'
import { Box } from '@thedatablitz/box'
import { Button } from '@thedatablitz/button'
import { Dropdown } from '@thedatablitz/dropdown'
import { Inline } from '@thedatablitz/inline'
import { PageHeader } from '@thedatablitz/page-header'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { TextInput } from '@thedatablitz/text-input'
import { createMember, fetchWorkspaceTeams } from '../../api/client'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useFetch } from '../../hooks/useFetch'
import { logError } from '../../utils/errorHandling'
import { checkboxRowStyle, fieldLabelStyle } from './styles'
import type { MemberStatus, RouteParams } from './types'
import {
  canSubmit,
  getReturnPath,
  getSummary,
  STATUS_OPTIONS,
  toggleTeamIds,
} from './utils/helpers'

const formShellClassName = 'w-full max-w-[600px] mx-auto px-4'

export function CreateMemberScreen() {
  const { workspaceId, teamId: teamIdFromUrl } = useParams<RouteParams>()
  const navigate = useNavigate()
  const { currentWorkspace, teams: workspaceTeams } = useWorkspace()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<MemberStatus>('Member')
  const [teamIds, setTeamIds] = useState<string[]>(() =>
    teamIdFromUrl ? [teamIdFromUrl] : []
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTeamScoped = Boolean(teamIdFromUrl)
  const teamName = workspaceTeams.find(
    (team) => team.id === teamIdFromUrl
  )?.name

  const { data: teams } = useFetch(
    () =>
      currentWorkspace
        ? fetchWorkspaceTeams(currentWorkspace.id)
        : Promise.resolve([]),
    [currentWorkspace?.id]
  )

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit(name, username, email, submitting)) return

    setError(null)
    setSubmitting(true)
    try {
      await createMember({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        status,
        teamIds: teamIds.length ? teamIds : undefined,
      })

      if (workspaceId) {
        navigate(getReturnPath(workspaceId, isTeamScoped, teamIdFromUrl))
      }
    } catch (err) {
      logError(err, 'CreateMember')
      setError(err instanceof Error ? err.message : 'Failed to create member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (!workspaceId) return
    navigate(getReturnPath(workspaceId, isTeamScoped, teamIdFromUrl))
  }

  const toggleTeam = (teamId: string) => {
    setTeamIds((prev) => toggleTeamIds(prev, teamId))
  }

  if (!workspaceId || !currentWorkspace) {
    return (
      <Box fullWidth className={formShellClassName}>
        <Text>Workspace not found.</Text>
      </Box>
    )
  }

  const summary = getSummary(isTeamScoped, currentWorkspace.name, teamName)

  return (
    <Box fullWidth className={formShellClassName}>
      <Stack gap="400">
        <PageHeader title="New member" subtitle={summary} />
        <form onSubmit={handleSubmit}>
          <Stack gap="400">
            <div>
              <label style={fieldLabelStyle}>
                <Text variant="body3">Name</Text>
              </label>
              <TextInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                disabled={submitting}
                autoFocus
                fullWidth
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>
                <Text variant="body3">Username</Text>
              </label>
              <TextInput
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                disabled={submitting}
                fullWidth
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>
                <Text variant="body3">Email</Text>
              </label>
              <TextInput
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={submitting}
                fullWidth
              />
            </div>
            <div>
              <label style={fieldLabelStyle}>
                <Text variant="body3">Status</Text>
              </label>
              <Dropdown
                options={STATUS_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                value={status}
                onChange={(value) => setStatus(value as MemberStatus)}
                disabled={submitting}
              />
            </div>
            {teams && teams.length > 0 && (
              <div>
                <label style={fieldLabelStyle}>
                  <Text variant="body3">Teams (optional)</Text>
                </label>
                <Stack gap="100">
                  {teams.map((team) => (
                    <label key={team.id} style={checkboxRowStyle}>
                      <input
                        type="checkbox"
                        checked={teamIds.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        disabled={submitting}
                      />
                      <Text variant="body3">{team.name}</Text>
                    </label>
                  ))}
                </Stack>
              </div>
            )}
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
                disabled={!canSubmit(name, username, email, submitting)}
              >
                {submitting ? 'Creating…' : 'Create member'}
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
