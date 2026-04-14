import { useParams } from 'react-router-dom'
import { Card, CardContent } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Button } from '@thedatablitz/button'
import { Alert } from '@thedatablitz/alert'
import { Dropdown } from '@thedatablitz/dropdown'
import { Box } from '@thedatablitz/box'
import type { ApiWorkspaceMcpToolCatalogItem } from '../../api/client'
import { useIntegrationBitsTabData } from './hook'

export function IntegrationBitsTab() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const wid = workspaceId ?? ''
  const {
    selectedProjectId,
    setSelectedProjectId,
    toolsQuery,
    items,
    setMutation,
    projectsQuery,
    projectOptions,
    agentCatalogQuery,
    catalogAgents,
    enabledAgentsQuery,
    enabledSet,
    enableAgentMutation,
    disableAgentMutation,
  } = useIntegrationBitsTabData(wid)

  const renderToolCard = (t: ApiWorkspaceMcpToolCatalogItem) => {
    const baseUrl = t.baseUrl?.trim() ?? ''
    const canEnable = Boolean(baseUrl)

    return (
      <Card
        key={t.toolKey}
        size="large"
        variant="default"
        className="max-w-[300px]"
      >
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
                <Button
                  size="small"
                  variant={t.enabled ? 'success' : 'danger'}
                  disabled={setMutation.isPending || (!t.enabled && !canEnable)}
                  onClick={() => {
                    if (t.enabled) {
                      setMutation.mutate({ toolKey: t.toolKey, enabled: false })
                      return
                    }
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

            {!t.enabled && !canEnable ? (
              <Text variant="caption2" color="color.text.subtle">
                Set a base URL for this tool (via API) before enabling it for
                the workspace.
              </Text>
            ) : null}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const renderAgentCard = (a: {
    agentKey: string
    title: string
    description: string
  }) => {
    const enabled = enabledSet.has(a.agentKey)
    const busy = enableAgentMutation.isPending || disableAgentMutation.isPending
    return (
      <Card
        key={a.agentKey}
        size="large"
        variant="ai"
        className="max-w-[300px]"
      >
        <CardContent>
          <Stack gap="150">
            <Inline justify="between" align="center" gap="150">
              <Stack gap="025">
                <Text variant="heading5">{a.title}</Text>
                <Text variant="body3" color="color.text.subtle">
                  {a.description}
                </Text>
              </Stack>
              <Inline align="center" gap="100" wrap={false}>
                <Button
                  size="small"
                  variant={enabled ? 'success' : 'danger'}
                  disabled={!selectedProjectId || busy}
                  onClick={() => {
                    if (!selectedProjectId) return
                    if (enabled) {
                      disableAgentMutation.mutate({
                        projectId: selectedProjectId,
                        agentKey: a.agentKey,
                      })
                      return
                    }
                    enableAgentMutation.mutate({
                      projectId: selectedProjectId,
                      agentKey: a.agentKey,
                    })
                  }}
                >
                  {enabled ? 'ON' : 'OFF'}
                </Button>
              </Inline>
            </Inline>
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
        <Text variant="heading4">External MCP tools</Text>
        <Text variant="body3" color="color.text.subtle">
          Enable streamable HTTP MCP servers per workspace. Configure each
          tool’s base URL with{' '}
          <Text variant="body3" as="span" color="color.text.DEFAULT">
            PUT /workspaces/:workspaceId/mcp-tools/:toolKey
          </Text>
          ; configured tools appear here.
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
      ) : items.length === 0 ? (
        <Text variant="body3" color="color.text.subtle">
          No MCP tools configured for this workspace yet.
        </Text>
      ) : (
        <Box className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map(renderToolCard)}
        </Box>
      )}

      <Stack gap="050" className="pt-2">
        <Text variant="heading4">Agents</Text>
        <Text variant="body3" color="color.text.subtle">
          Enable specialized InteleBit agents per project. When multiple agents
          are enabled, InteleBit will route your message to the best-fit agent.
        </Text>
      </Stack>

      {projectsQuery.error ? (
        <Alert
          variant="danger"
          title="Failed to load projects"
          description={
            projectsQuery.error instanceof Error
              ? projectsQuery.error.message
              : String(projectsQuery.error)
          }
        />
      ) : null}

      <Inline align="flex-start">
        <Dropdown
          value={selectedProjectId}
          onChange={setSelectedProjectId}
          options={projectOptions}
          selectionType="single"
          placeholder={
            projectsQuery.isPending ? 'Loading projects…' : 'Select a project'
          }
          size="small"
        />
      </Inline>

      {agentCatalogQuery.error ? (
        <Alert
          variant="danger"
          title="Failed to load agent catalog"
          description={
            agentCatalogQuery.error instanceof Error
              ? agentCatalogQuery.error.message
              : String(agentCatalogQuery.error)
          }
        />
      ) : null}

      {selectedProjectId && enabledAgentsQuery.error ? (
        <Alert
          variant="danger"
          title="Failed to load enabled agents"
          description={
            enabledAgentsQuery.error instanceof Error
              ? enabledAgentsQuery.error.message
              : String(enabledAgentsQuery.error)
          }
        />
      ) : null}

      {agentCatalogQuery.isPending ? (
        <Text variant="body3" color="color.text.subtle">
          Loading agents…
        </Text>
      ) : (
        <Box className="flex flex-wrap gap-4">
          {catalogAgents.map(renderAgentCard)}
        </Box>
      )}
    </Stack>
  )
}
