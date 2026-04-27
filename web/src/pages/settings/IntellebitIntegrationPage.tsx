import { Badge } from '@thedatablitz/badge'
import { Card } from '@thedatablitz/card'
import { Dropdown, type DropdownOption } from '@thedatablitz/dropdown'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Brain, Wrench } from 'lucide-react'
import {
  useId,
  useMemo,
  useState,
  type ComponentType,
  type PropsWithChildren,
} from 'react'
import styled from 'styled-components'
import { IntegrationEnableRow } from '../../components'
import { useIntellebitProjectAgentsAndTools } from './hooks'
import { itT } from './integrationTokens'
import { SettingsSubpageMain } from './settingsSubpageChrome'

/** Published `Card` typings lag `variant="base"`; align with project-detail pattern. */
const BaseSettingCard = Card as unknown as ComponentType<
  PropsWithChildren<{
    variant: 'base'
    borderTone?: 'none' | 'accent' | 'interactive'
    className?: string
  }>
>

const HERO_MAX = '64rem'

const BentoGrid = styled.div`
  max-width: ${HERO_MAX};
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${itT('space.300')};

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const SpanTwo = styled.div`
  @media (min-width: 768px) {
    grid-column: span 2;
  }
`

const IconTile = styled.div`
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${itT('color.background.neutral.subtle')};
  flex-shrink: 0;
`

export function IntellebitIntegrationPage() {
  useId()
  const integration = useIntellebitProjectAgentsAndTools()
  const projects = useMemo(() => integration.projects.data ?? [], [integration.projects.data])
  const tools = useMemo(
    () => integration.workspaceTools.data ?? [],
    [integration.workspaceTools.data]
  )
  const agentCatalog = useMemo(
    () => integration.agentCatalog.data ?? [],
    [integration.agentCatalog.data]
  )
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  )

  const projectOptions: DropdownOption[] = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [projects]
  )

  const effectiveSelectedProjectId = useMemo(() => {
    if (selectedProjectId && projects.some((p) => p.id === selectedProjectId)) {
      return selectedProjectId
    }
    return projects[0]?.id ?? null
  }, [projects, selectedProjectId])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === effectiveSelectedProjectId) ?? null,
    [effectiveSelectedProjectId, projects]
  )

  return (
    <>
      <SettingsSubpageMain>
        <div style={{ maxWidth: HERO_MAX, margin: '0 auto 4rem' }}>
          <Text
            as="h2"
            variant="heading1"
            color="color.text.DEFAULT"
            style={{
              margin: '0 0 1rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
            }}
          >
            Intellebit Integration
          </Text>
          <Text
            as="p"
            variant="body1"
            color="color.text.subtle"
            style={{
              margin: 0,
              maxWidth: '36rem',
              lineHeight: 1.5,
              fontSize: '1.125rem',
            }}
          >
            Configure and manage your neural processing modules and editorial
            automation engines. Optimize the synergy between academic precision
            and AI execution.
          </Text>

          <div style={{ marginTop: '1.5rem' }}>
            <Stack gap="200" fullWidth>
              <Inline gap="200" align="center" wrap fullWidth>
                <Badge
                  label={integration.isLoading ? 'LOADING' : 'READY'}
                  variant={integration.isLoading ? 'neutral' : 'secondary'}
                  size="small"
                />
                <Badge
                  label={`Projects: ${projects.length}`}
                  variant="neutral"
                  size="small"
                />
                <Badge
                  label={`Agents: ${agentCatalog.length}`}
                  variant="neutral"
                  size="small"
                />
                {integration.selectedWorkspaceId ? (
                  <Badge
                    label={`Workspace: ${integration.selectedWorkspaceId}`}
                    variant="neutral"
                    size="small"
                  />
                ) : (
                  <Badge
                    label="Workspace: (not selected)"
                    variant="neutral"
                    size="small"
                  />
                )}
                <Badge
                  label={`Tools: ${tools.length}`}
                  variant="neutral"
                  size="small"
                />
              </Inline>

              {projectOptions.length ? (
                <div style={{ maxWidth: 520 }}>
                  <Dropdown
                    options={projectOptions}
                    value={effectiveSelectedProjectId ?? undefined}
                    onChange={(value) => setSelectedProjectId(value)}
                    size="large"
                    surface="mobile"
                    chevronMode="split"
                  />
                </div>
              ) : null}
            </Stack>

            {integration.error ? (
              <Text
                as="p"
                variant="body3"
                color="color.text.subtle"
                style={{ margin: '0.75rem 0 0', lineHeight: 1.6 }}
              >
                Error loading integration data:{' '}
                {integration.error instanceof Error
                  ? integration.error.message
                  : String(integration.error)}
              </Text>
            ) : null}
          </div>
        </div>

        <BentoGrid>
          <SpanTwo>
            <BaseSettingCard variant="base" borderTone="none">
              <Stack gap="400" fullWidth>
                <Inline gap="300" align="center" wrap={false}>
                  <IconTile aria-hidden>
                    <Wrench size={28} strokeWidth={1.75} />
                  </IconTile>
                  <div style={{ minWidth: 0 }}>
                    <Text
                      as="h3"
                      variant="heading4"
                      color="color.text.DEFAULT"
                      style={{ margin: 0, fontWeight: 800 }}
                    >
                      Workspace tools (MCP servers)
                    </Text>
                    <Text
                      as="p"
                      variant="body3"
                      color="color.text.subtle"
                      style={{ margin: '0.5rem 0 0', lineHeight: 1.6 }}
                    >
                      Enable/disable external tool servers available to agents
                      in this workspace.
                    </Text>
                  </div>
                </Inline>

                {!integration.selectedWorkspaceId ? (
                  <Text
                    as="p"
                    variant="body3"
                    color="color.text.subtle"
                    style={{ margin: 0, lineHeight: 1.6 }}
                  >
                    Select a workspace in the sidebar first to configure tools.
                  </Text>
                ) : tools.length === 0 ? (
                  <Text
                    as="p"
                    variant="body3"
                    color="color.text.subtle"
                    style={{ margin: 0, lineHeight: 1.6 }}
                  >
                    No tools configured for this workspace yet.
                  </Text>
                ) : (
                  <Stack gap="200" fullWidth>
                    {tools.map((t) => (
                      <IntegrationEnableRow
                        key={t.toolKey}
                        title={t.name}
                        description={t.description}
                        enabled={t.enabled}
                        titleVariant="body2"
                        extraBadges={
                          t.hasToken ? (
                            <Badge
                              label="TOKEN"
                              variant="secondary"
                              size="small"
                            />
                          ) : null
                        }
                        ariaLabel={`${t.enabled ? 'Disable' : 'Enable'} tool ${t.toolKey}`}
                        onToggle={() => {
                          if (!integration.selectedWorkspaceId) return
                          integration.actions.setToolEnabled({
                            workspaceId: integration.selectedWorkspaceId,
                            toolKey: t.toolKey,
                            enabled: !t.enabled,
                          })
                        }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </BaseSettingCard>
          </SpanTwo>

          <SpanTwo>
            <BaseSettingCard variant="base" borderTone="none">
              <Stack gap="400" fullWidth>
                <Inline gap="300" align="center" wrap={false}>
                  <IconTile aria-hidden>
                    <Brain size={28} strokeWidth={1.75} />
                  </IconTile>
                  <div style={{ minWidth: 0 }}>
                    <Text
                      as="h3"
                      variant="heading4"
                      color="color.text.DEFAULT"
                      style={{ margin: 0, fontWeight: 800 }}
                    >
                      Project agents
                    </Text>
                    <Text
                      as="p"
                      variant="body3"
                      color="color.text.subtle"
                      style={{ margin: '0.5rem 0 0', lineHeight: 1.6 }}
                    >
                      Toggle which specialist agents are enabled per project.
                    </Text>
                  </div>
                </Inline>

                {projects.length === 0 ? (
                  <Text
                    as="p"
                    variant="body3"
                    color="color.text.subtle"
                    style={{ margin: 0, lineHeight: 1.6 }}
                  >
                    No projects found.
                  </Text>
                ) : agentCatalog.length === 0 ? (
                  <Text
                    as="p"
                    variant="body3"
                    color="color.text.subtle"
                    style={{ margin: 0, lineHeight: 1.6 }}
                  >
                    No agent catalog entries returned from the API, so there’s
                    nothing to toggle yet.
                  </Text>
                ) : !selectedProject ? (
                  <Text
                    as="p"
                    variant="body3"
                    color="color.text.subtle"
                    style={{ margin: 0, lineHeight: 1.6 }}
                  >
                    Select a project above to manage its agents.
                  </Text>
                ) : (
                  <Stack gap="300" fullWidth>
                    <Inline
                      justify="space-between"
                      align="center"
                      wrap={false}
                      fullWidth
                    >
                      <Text
                        as="div"
                        variant="body2"
                        color="color.text.DEFAULT"
                        truncate
                        style={{ fontWeight: 900 }}
                      >
                        {selectedProject.name}
                      </Text>
                    </Inline>

                    <Stack gap="200" fullWidth>
                      {(
                        integration.agentTogglesByProjectId.get(
                          selectedProject.id
                        ) ?? []
                      ).map((a) => (
                        <IntegrationEnableRow
                          key={a.agentKey}
                          title={a.title}
                          description={a.description}
                          enabled={a.enabled}
                          ariaLabel={`${a.enabled ? 'Disable' : 'Enable'} agent ${a.agentKey} for project ${selectedProject.name}`}
                          onToggle={() => {
                            integration.actions.setAgentEnabled({
                              projectId: selectedProject.id,
                              agentKey: a.agentKey,
                              enabled: !a.enabled,
                            })
                          }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </BaseSettingCard>
          </SpanTwo>
        </BentoGrid>
      </SettingsSubpageMain>
    </>
  )
}
