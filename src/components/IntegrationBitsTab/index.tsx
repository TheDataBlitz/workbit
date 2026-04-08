import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Button } from '@thedatablitz/button'
import { Alert } from '@thedatablitz/alert'
import {
  fetchWorkspaceMcpTools,
  setWorkspaceMcpTool,
  testWorkspaceMcpTool,
  type ApiWorkspaceMcpToolCatalogItem,
} from '../../api/client'

export function IntegrationBitsTab() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const wid = workspaceId ?? ''
  const queryClient = useQueryClient()

  const toolsQuery = useQuery({
    queryKey: ['workspace', wid, 'mcp-tools'],
    queryFn: () => fetchWorkspaceMcpTools(wid),
    enabled: Boolean(wid),
  })

  const setMutation = useMutation({
    mutationFn: (input: { toolKey: string; enabled: boolean }) =>
      setWorkspaceMcpTool(wid, input.toolKey, {
        enabled: input.enabled,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['workspace', wid, 'mcp-tools'],
      })
    },
  })

  const testMutation = useMutation({
    mutationFn: (input: { toolKey: string; baseUrl: string }) =>
      testWorkspaceMcpTool(wid, input.toolKey, {
        baseUrl: input.baseUrl,
      }),
  })

  const items = toolsQuery.data?.tools ?? []

  const renderToolCard = (t: ApiWorkspaceMcpToolCatalogItem) => {
    const baseUrl = t.baseUrl?.trim() ?? ''
    const canEnable = Boolean(baseUrl)

    return (
      <Card key={t.toolKey} size="large" variant="default" fullWidth>
        <CardContent>
          <Stack gap="150">
            <Inline
              justify="between"
              align="center"
              fullWidth
              wrap={false}
              gap="150"
            >
              <Stack gap="025">
                <Text variant="heading5">{t.name}</Text>
                <Text variant="body3" color="color.text.subtle">
                  {t.description}
                </Text>
              </Stack>
              <Inline align="center" gap="100" wrap={false}>
                <Text variant="caption2" color="color.text.subtle">
                  {t.enabled ? 'Enabled' : 'Disabled'}
                </Text>
                <Button
                  size="small"
                  variant={t.enabled ? 'success' : 'danger'}
                  disabled={setMutation.isPending || (!t.enabled && !canEnable)}
                  onClick={() => {
                    if (t.enabled) {
                      setMutation.mutate({ toolKey: t.toolKey, enabled: false })
                      return
                    }
                    // enabling requires baseUrl to be present (hardcoded by backend)
                    setMutation.mutate({
                      toolKey: t.toolKey,
                      enabled: true,
                    })
                  }}
                >
                  {t.enabled ? 'ON' : 'OFF'}
                </Button>
              </Inline>
            </Inline>

            <Inline gap="150" wrap={false} fullWidth>
              <Button
                variant="glass"
                disabled={!baseUrl || testMutation.isPending}
                onClick={() =>
                  testMutation.mutate({
                    toolKey: t.toolKey,
                    baseUrl,
                  })
                }
              >
                Test connection
              </Button>
              <Text variant="caption2" color="color.text.subtle">
                Base URL: {baseUrl || '—'}
              </Text>
            </Inline>

            {testMutation.data?.ok ? (
              <Alert
                variant="success"
                title="Connected"
                description={`Found ${(testMutation.data.tools ?? []).length} tools.`}
              />
            ) : null}
            {testMutation.error ? (
              <Alert
                variant="danger"
                title="Connection failed"
                description={
                  testMutation.error instanceof Error
                    ? testMutation.error.message
                    : String(testMutation.error)
                }
              />
            ) : null}

            {!t.enabled && !canEnable ? (
              <Text variant="caption2" color="color.text.subtle">
                Add a base URL to enable this tool for the workspace.
              </Text>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  if (!wid) {
    return (
      <Text variant="body3" color="color.text.subtle">
        Select a workspace to manage IntegrationBits.
      </Text>
    )
  }

  return (
    <Stack gap="200" fullWidth>
      <Stack gap="050">
        <Text variant="heading4">IntegrationBits</Text>
        <Text variant="body3" color="color.text.subtle">
          Enable MCP tools for this workspace. Enabled tools become available to
          the backend AI tool loop.
        </Text>
      </Stack>

      {toolsQuery.error ? (
        <Alert
          variant="danger"
          title="Failed to load tools"
          description={
            toolsQuery.error instanceof Error
              ? toolsQuery.error.message
              : String(toolsQuery.error)
          }
        />
      ) : null}

      {toolsQuery.isPending ? (
        <Text variant="body3" color="color.text.subtle">
          Loading tools…
        </Text>
      ) : (
        <Stack gap="200">{items.map(renderToolCard)}</Stack>
      )}
    </Stack>
  )
}
