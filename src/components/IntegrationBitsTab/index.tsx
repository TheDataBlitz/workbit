import { useParams } from 'react-router-dom'
import { Card, CardContent } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Button } from '@thedatablitz/button'
import { Alert } from '@thedatablitz/alert'
import { Dropdown } from '@thedatablitz/dropdown'
import { Box } from '@thedatablitz/box'
import { PageHeader } from '@thedatablitz/page-header'
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
    testMutation,
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
      <PageHeader
        avatar={{ name: 'IntegrationBits' }}
        title="IntegrationBits"
        subtitle="Enable MCP tools for this workspace. Enabled tools become available to the backend AI tool loop."
      />

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
        <Inline>{catalogAgents.map(renderAgentCard)}</Inline>
      )}
    </Stack>
  )
}
