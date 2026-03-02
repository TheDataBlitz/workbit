import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
  Button,
  Input,
  Select,
  Card,
  Container,
  Stack,
  Text,
  Heading,
} from '@design-system'
import {
  createWorkspace,
  fetchWorkspaces,
  fetchMembers,
  type ApiWorkspace,
  type ApiMember,
} from '../api/client'
import { useAuthRequired } from './auth/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { logError } from '../utils/errorHandling'

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 32px;
  padding: 32px 24px;
  background: ${(p) => p.theme.colors.background};
  color: ${(p) => p.theme.colors.text};
`

const LeftColumn = styled.div`
  flex: 0 0 400px;
  max-width: 100%;
`

const RightColumn = styled.div`
  flex: 1 1 360px;
  max-width: 520px;
  min-width: 0;
`

const WorkspaceCard = styled(Card)`
  padding: 32px 32px 28px;
`

const WorkspaceListItemCard = styled(Card)`
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 0.8rem;
    font-weight: 500;
    color: ${(p) => p.theme.colors.text};
  }

  small {
    font-size: 0.75rem;
    color: ${(p) => p.theme.colors.textMuted};
  }
`

const UrlFieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const UrlPrefix = styled.div`
  padding: 0 10px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.5);
  font-size: 0.8rem;
  color: ${(p) => p.theme.colors.textMuted};
`

const ErrorText = styled.p`
  margin: 4px 0 0;
  font-size: 0.8rem;
  color: ${(p) => p.theme.colors.error ?? '#f97373'};
`

const Footer = styled.div`
  margin-top: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`

const WorkspaceListGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const CardTitle = styled.strong`
  font-size: 0.95rem;
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
`

const CardMeta = styled.span`
  font-size: 0.8rem;
  color: ${(p) => p.theme.colors.textMuted};
`

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function WorkspacesScreen() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [region, setRegion] = useState('us')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState<ApiWorkspace[]>([])
  const [workspacesError, setWorkspacesError] = useState<string | null>(null)
  const [workspacesLoading, setWorkspacesLoading] = useState(true)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuthRequired()
  const userId = user?.id ?? null
  const navigate = useNavigate()
  const { setCurrentWorkspace, refreshWorkspaces } = useWorkspace()

  const derivedSlug = useMemo(() => {
    if (slug) return slug
    return slugify(name || 'workspace')
  }, [name, slug])

  // Resolve the current memberId for the logged-in user
  useEffect(() => {
    if (authLoading) return
    let cancelled = false
    async function resolveMember() {
      setMemberError(null)
      try {
        const members: ApiMember[] = await fetchMembers()
        const current = members.find((m) => m.uid && userId && m.uid === userId)
        if (!cancelled) {
          setMemberId(current?.id ?? null)
          if (!current) {
            setMemberError(
              'No workspace member profile found for this account. Ask an admin to add you as a member.'
            )
          }
        }
      } catch (e) {
        if (!cancelled) {
          logError(e, 'WorkspacesScreen.resolveMember')
          setMemberError(
            e instanceof Error
              ? e.message
              : 'Failed to resolve workspace member.'
          )
        }
      }
    }
    if (userId) {
      void resolveMember()
    }
    return () => {
      cancelled = true
    }
  }, [authLoading, userId])

  // Load workspaces for the resolved memberId
  useEffect(() => {
    if (!memberId) return
    let cancelled = false
    async function load() {
      setWorkspacesLoading(true)
      setWorkspacesError(null)
      try {
        const data = await fetchWorkspaces(memberId as string)
        if (!cancelled) {
          setWorkspaces(data)
        }
      } catch (e) {
        if (!cancelled) {
          logError(e, 'WorkspacesScreen.loadWorkspaces')
          setWorkspacesError(
            e instanceof Error ? e.message : 'Failed to load workspaces.'
          )
        }
      } finally {
        if (!cancelled) {
          setWorkspacesLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [memberId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Workspace name is required.')
      return
    }
    const finalSlug = slugify(derivedSlug)
    if (!finalSlug) {
      setError('Workspace URL is required.')
      return
    }
    if (!memberId) {
      setError(
        memberError ??
          'Could not resolve your workspace member profile. Please refresh or contact an admin.'
      )
      return
    }
    setSubmitting(true)
    try {
      await createWorkspace({
        name: name.trim(),
        slug: finalSlug,
        region,
        memberId,
      })
      // Refresh list after creating a workspace
      const updated = await fetchWorkspaces(memberId)
      setWorkspaces(updated)
      void refreshWorkspaces()
      setName('')
      setSlug('')
    } catch (e) {
      logError(e, 'WorkspacesScreen.createWorkspace')
      const msg = e instanceof Error ? e.message : 'Failed to create workspace.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  function handleSelectWorkspace(ws: ApiWorkspace) {
    setCurrentWorkspace(ws)
    navigate(`/workspace/${ws.id}/inbox`)
  }

  return (
    <Page>
      <Container maxWidth="960px">
        <div
          style={{
            width: '100%',
            display: 'flex',
            gap: 32,
            alignItems: 'stretch',
          }}
        >
          <LeftColumn>
            <WorkspaceCard>
              <Stack gap={3}>
                <Stack gap={1}>
                  <Heading level={1}>Create a new workspace</Heading>
                  <Text size="sm" muted>
                    Workspaces are shared environments where teams can work on
                    projects, cycles and issues.
                  </Text>
                </Stack>

                <Form onSubmit={handleSubmit}>
                  <Field>
                    <label htmlFor="workspace-name">Workspace Name</label>
                    <Input
                      id="workspace-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Acme Inc"
                      autoComplete="organization"
                      autoFocus
                    />
                  </Field>

                  <Field>
                    <label htmlFor="workspace-url">Workspace URL</label>
                    <UrlFieldRow>
                      <UrlPrefix>workbit.app/</UrlPrefix>
                      <Input
                        id="workspace-url"
                        value={slug}
                        onChange={(e) => setSlug(slugify(e.target.value))}
                        placeholder={derivedSlug}
                      />
                    </UrlFieldRow>
                    <small>
                      <Text as="span" size="xs" muted>
                        This URL will be used to access your workspace and must
                        be unique.
                      </Text>
                    </small>
                  </Field>

                  <Field>
                    <label>Workspace region</label>
                    <Select
                      value={region}
                      onChange={(value) => setRegion(value)}
                      options={[
                        { value: 'us', label: 'United States' },
                        { value: 'eu', label: 'European Union' },
                      ]}
                    />
                    <Text as="span" size="xs" muted>
                      Workspace will be hosted in the selected region.
                    </Text>
                  </Field>

                  {error && <ErrorText>{error}</ErrorText>}

                  <Footer>
                    <Text as="span" size="xs" muted>
                      {memberId
                        ? `Logged in member: ${memberId}`
                        : 'Logged in, but no workspace member profile found yet.'}
                    </Text>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Creating…' : 'Create workspace'}
                    </Button>
                  </Footer>
                </Form>
              </Stack>
            </WorkspaceCard>
          </LeftColumn>

          <RightColumn>
            <Stack gap={2}>
              <Heading level={2}>Your workspaces</Heading>
              <Text size="sm" muted>
                Select a workspace to open it.
              </Text>
              <WorkspaceListGrid>
                {workspacesLoading && (
                  <Text size="xs" muted>
                    Loading your workspaces…
                  </Text>
                )}
                {workspacesError && (
                  <ErrorText>
                    Failed to load workspaces: {workspacesError}
                  </ErrorText>
                )}
                {!workspacesLoading &&
                  !workspacesError &&
                  workspaces.length === 0 && (
                    <Text size="xs" muted>
                      No workspaces yet. Create your first one in the form.
                    </Text>
                  )}
                {!workspacesLoading &&
                  !workspacesError &&
                  workspaces.map((ws) => (
                    <WorkspaceListItemCard key={ws.id}>
                      <div>
                        <CardTitle>{ws.name}</CardTitle>
                        <div>
                          <CardMeta>
                            workbit.app/{ws.slug} · {ws.region.toUpperCase()}
                          </CardMeta>
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => handleSelectWorkspace(ws)}
                      >
                        Select
                      </Button>
                    </WorkspaceListItemCard>
                  ))}
              </WorkspaceListGrid>
            </Stack>
          </RightColumn>
        </div>
      </Container>
    </Page>
  )
}
