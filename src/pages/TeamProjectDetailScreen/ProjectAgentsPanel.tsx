import type { CSSProperties } from 'react'
import { Accordion } from '@thedatablitz/accordion'
import { Button } from '@thedatablitz/button'
import { Card, CardContent, CardFooter, CardHeader } from '@thedatablitz/card'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'

import { useProjectAgentsPanel } from './hooks/useProjectAgentsPanel'

const ACCORDION_ITEM_ID = 'ai-agent-catalog'

/** Scrollable list of agent cards; keeps the sidebar from growing without bound. */
const catalogScrollStyle: CSSProperties = {
  maxHeight: 'min(280px, 42vh)',
  overflowY: 'auto',
  minHeight: 0,
}

type ProjectAgentsPanelProps = {
  projectId: string | undefined
}

export function ProjectAgentsPanel({ projectId }: ProjectAgentsPanelProps) {
  const {
    catalogAgents,
    catalogLoading,
    catalogError,
    enabledKeys,
    enableAgent,
    disableAgent,
    busyAgentKey,
  } = useProjectAgentsPanel(projectId)

  if (!projectId) {
    return null
  }

  return (
    <Accordion
      size="medium"
      defaultExpandedIds={[ACCORDION_ITEM_ID]}
      items={[
        {
          id: ACCORDION_ITEM_ID,
          title: (
            <Text variant="heading7" as="span">
              AI agents
            </Text>
          ),
          content: (
            <Stack gap="300">
              <Text variant="body3" color="color.text.subtle">
                Enable specialists for this project. When you ask InteleBit with
                this project, the app picks a matching enabled agent and uses
                the same workspace tools to answer.
              </Text>

              {catalogError ? (
                <Text variant="body3" color="color.text.DEFAULT" as="p">
                  {catalogError instanceof Error
                    ? catalogError.message
                    : 'Could not load agents.'}
                </Text>
              ) : null}

              {catalogLoading ? (
                <Text variant="body3" color="color.text.subtle">
                  Loading agents…
                </Text>
              ) : (
                <div style={catalogScrollStyle}>
                  <Stack gap="200">
                    {catalogAgents.map((agent) => {
                      const isEnabled = enabledKeys.has(agent.agentKey)
                      const busy = busyAgentKey === agent.agentKey
                      const anotherRowBusy =
                        busyAgentKey !== null && busyAgentKey !== agent.agentKey

                      return (
                        <Card
                          key={agent.agentKey}
                          size="small"
                          fullWidth
                          variant="ai"
                          type="bordered"
                        >
                          <CardHeader>
                            <Text variant="heading7">{agent.title}</Text>
                          </CardHeader>
                          <CardContent divider>
                            <Text variant="body3" color="color.text.subtle">
                              {agent.description}
                            </Text>
                          </CardContent>
                          <CardFooter>
                            <Button
                              size="small"
                              variant={isEnabled ? 'danger' : 'primary'}
                              loading={busy}
                              disabled={anotherRowBusy}
                              onClick={() => {
                                if (isEnabled) {
                                  disableAgent(agent.agentKey)
                                } else {
                                  enableAgent(agent.agentKey)
                                }
                              }}
                            >
                              {isEnabled ? 'Remove' : 'Add'}
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    })}
                  </Stack>
                </div>
              )}
            </Stack>
          ),
        },
      ]}
    />
  )
}
