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
import { createMember, fetchWorkspaceTeams } from '../api/client'
import { useFetch } from '../hooks/useFetch'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { logError } from '../utils/errorHandling'

const STATUS_OPTIONS = [
  { value: 'Member', label: 'Member' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Guest', label: 'Guest' },
]

export function CreateMemberScreen() {
  const { workspaceId, teamId: teamIdFromUrl } = useParams<{
    workspaceId: string
    teamId?: string
  }>()
  const navigate = useNavigate()
  const { currentWorkspace, teams: workspaceTeams } = useWorkspace()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('Member')
  const [teamIds, setTeamIds] = useState<string[]>(() =>
    teamIdFromUrl ? [teamIdFromUrl] : []
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTeamScoped = Boolean(teamIdFromUrl)
  const teamName = workspaceTeams.find((t) => t.id === teamIdFromUrl)?.name

  const { data: teams } = useFetch(
    () =>
      currentWorkspace
        ? fetchWorkspaceTeams(currentWorkspace.id)
        : Promise.resolve([]),
    [currentWorkspace?.id]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !username.trim() || !email.trim()) return
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
      if (isTeamScoped && workspaceId && teamIdFromUrl) {
        navigate(
          `/workspace/${workspaceId}/team/${teamIdFromUrl}/issues/active`
        )
      } else {
        navigate(`/workspace/${workspaceId}/workspace/member`)
      }
    } catch (err) {
      logError(err, 'CreateMember')
      setError(err instanceof Error ? err.message : 'Failed to create member')
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
        navigate(`/workspace/${workspaceId}/workspace/member`)
      }
    }
  }

  const toggleTeam = (teamId: string) => {
    setTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    )
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
      ? `Add a member to ${currentWorkspace.name} and assign to ${teamName}.`
      : `Invite a member to ${currentWorkspace.name}.`

  return (
    <Container maxWidth="600px">
      <Stack gap={4}>
        <PageHeader title="New member" summary={summary} />
        <form onSubmit={handleSubmit}>
          <Stack gap={4}>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text size="sm">Name</Text>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                disabled={submitting}
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text size="sm">Username</Text>
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                disabled={submitting}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text size="sm">Email</Text>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={submitting}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8 }}>
                <Text size="sm">Status</Text>
              </label>
              <Select
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
              />
            </div>
            {teams && teams.length > 0 && (
              <div>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <Text size="sm">Teams (optional)</Text>
                </label>
                <Stack gap={1}>
                  {teams.map((team) => (
                    <label
                      key={team.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <input
                        type="checkbox"
                        checked={teamIds.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        disabled={submitting}
                      />
                      <Text size="sm">{team.name}</Text>
                    </label>
                  ))}
                </Stack>
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
                disabled={
                  !name.trim() ||
                  !username.trim() ||
                  !email.trim() ||
                  submitting
                }
              >
                {submitting ? 'Creating…' : 'Create member'}
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
