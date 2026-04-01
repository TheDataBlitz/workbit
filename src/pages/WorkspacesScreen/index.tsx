import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'

import { Alert } from '@thedatablitz/alert'
import { Dropdown } from '@thedatablitz/dropdown'
import { TextInput as Input } from '@thedatablitz/text-input'
import { Text } from '@thedatablitz/text'
import { Badge } from '@thedatablitz/badge'
import { Box } from '@thedatablitz/box'
import { Avatar } from '@thedatablitz/avatar'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Card, CardContent, CardFooter, CardHeader } from '@thedatablitz/card'

import { createWorkspace, type ApiWorkspace } from '../../api/client'
import { useAuthRequired } from '../auth/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { logError } from '../../utils/errorHandling'
import { REGION_OPTIONS, slugify, workspaceInitials } from './utils'
import { workspacesListQueryKeyPrefix } from '../../contexts/workspaceQueryKeys'
import { useWorkspacesData } from './hooks/useWorkspacesData'
import { Button } from '@thedatablitz/button'

export function WorkspacesScreen() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [region, setRegion] = useState('us')
  const [validationError, setValidationError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuthRequired()
  const userId = user?.id ?? null
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setCurrentWorkspace, refreshWorkspaces } = useWorkspace()
  const {
    memberId,
    memberError,
    workspaces,
    workspacesError,
    workspacesLoading,
  } = useWorkspacesData({
    userId,
    authLoading,
  })

  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: workspacesListQueryKeyPrefix,
      })
      void refreshWorkspaces()
      setName('')
      setSlug('')
    },
    onError: (e) => {
      logError(e, 'WorkspacesScreen.createWorkspace')
    },
  })

  const derivedSlug = useMemo(() => {
    if (slug) return slug
    return slugify(name || 'workspace')
  }, [name, slug])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    createWorkspaceMutation.reset()
    setValidationError(null)
    if (!name.trim()) {
      setValidationError('Workspace name is required.')
      return
    }
    const finalSlug = slugify(derivedSlug)
    if (!finalSlug) {
      setValidationError('Workspace URL is required.')
      return
    }
    if (!memberId) {
      setValidationError(
        memberError ??
          'Could not resolve your workspace member profile. Please refresh or contact an admin.'
      )
      return
    }
    try {
      await createWorkspaceMutation.mutateAsync({
        name: name.trim(),
        slug: finalSlug,
        region,
        memberId,
      })
    } catch {
      /* Error surfaced via createWorkspaceMutation.error */
    }
  }

  const createError =
    createWorkspaceMutation.isError && createWorkspaceMutation.error
      ? createWorkspaceMutation.error instanceof Error
        ? createWorkspaceMutation.error.message
        : 'Failed to create workspace.'
      : null

  const formError = validationError ?? createError

  function handleSelectWorkspace(workspace: ApiWorkspace) {
    setCurrentWorkspace(workspace)
    navigate(`/workspace/${workspace.id}/workspace/projects`)
  }

  return (
    <>
      <Inline padding="200" align="center" gap="100">
        <Avatar name="Workbit" size="small" variant="brand" />
        <Text className="font-semibold text-sm tracking-tight">Workbit</Text>
      </Inline>

      <Stack justify="center" gap="600" align="center">
        <Stack align="center">
          <Text variant="heading1">Workspaces</Text>
          <Text>Manage your workspaces or create a new one for your team.</Text>
        </Stack>

        <Stack>
          <Card>
            <CardHeader>
              <Stack>
                <Text variant="heading3">Create a new workspace</Text>
                <Text variant="body3">
                  Workspaces are shared environments <br /> where teams can work
                  on projects, cycles and issues.
                </Text>
              </Stack>
            </CardHeader>
            <CardContent divider>
              <form onSubmit={handleSubmit}>
                <Stack gap="200">
                  <Input
                    label="Workspace name"
                    id="workspace-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Inc"
                    autoComplete="organization"
                    autoFocus
                  />

                  <Stack gap="100">
                    <Input
                      required
                      label="Workspace URL"
                      id="workspace-url"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder={derivedSlug}
                      className="flex-1"
                    />

                    <Text
                      variant="body4"
                      color="color.background.information.bold"
                    >
                      This URL will be used to access your workspace and must be
                      unique.
                    </Text>
                  </Stack>

                  <Stack gap="100">
                    <Text variant="body3">Workspace region</Text>
                    <Dropdown
                      size="medium"
                      value={region}
                      options={REGION_OPTIONS}
                      onChange={(v) => setRegion(v)}
                      placeholder="Select region"
                    />
                    <Text
                      variant="body4"
                      color="color.background.information.bold"
                    >
                      Workspace will be hosted in the selected region.
                    </Text>
                  </Stack>

                  {formError ? (
                    <Alert
                      variant="error"
                      placement="inline"
                      description={formError}
                      className="w-full"
                    />
                  ) : null}
                </Stack>
              </form>
            </CardContent>
            <CardFooter>
              <Button
                variant="primary"
                loading={createWorkspaceMutation.isPending}
                disabled={createWorkspaceMutation.isPending}
              >
                Create workspace
              </Button>
            </CardFooter>
          </Card>

          <Card fullWidth>
            <CardHeader>
              <Stack>
                <Text variant="heading3">Your workspaces</Text>
                <Text variant="body3">Select a workspace to open it.</Text>
              </Stack>
            </CardHeader>
            <CardContent>
              <Stack gap="200">
                {workspacesLoading && (
                  <Stack gap="200">
                    <Box className="h-20 w-full rounded-xl animate-pulse bg-muted/60" />
                    <Box className="h-20 w-full rounded-xl animate-pulse bg-muted/60" />
                    <Box className="h-20 w-full rounded-xl animate-pulse bg-muted/60" />
                  </Stack>
                )}

                {workspacesError ? (
                  <Alert
                    variant="error"
                    placement="inline"
                    description={`Failed to load workspaces: ${workspacesError}`}
                    className="w-full"
                  />
                ) : null}

                {!workspacesLoading &&
                  !workspacesError &&
                  workspaces.length === 0 && (
                    <Box padding="600" border>
                      <Building2
                        size={32}
                        className="mx-auto mb-3 opacity-50"
                      />
                      <Text>
                        No workspaces yet. Create your first one in the form.
                      </Text>
                    </Box>
                  )}

                {!workspacesLoading &&
                  !workspacesError &&
                  workspaces.map((workspace) => (
                    <Card fullWidth key={workspace.id}>
                      <CardContent>
                        <Inline align="center" gap="200">
                          <Avatar
                            name={workspaceInitials(workspace.name)}
                            size="medium"
                            variant="brand"
                          />

                          <Box>
                            <Text>{workspace.name}</Text>
                            <Inline align="center">
                              <Text variant="caption2">
                                workbit.app/{workspace.slug}
                              </Text>
                              <Badge variant="info" size="small">
                                {workspace.region.toUpperCase()}
                              </Badge>
                            </Inline>
                          </Box>

                          <Button
                            variant="glass"
                            size="small"
                            onClick={() => handleSelectWorkspace(workspace)}
                          >
                            Select
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Inline>
                      </CardContent>
                    </Card>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </>
  )
}
