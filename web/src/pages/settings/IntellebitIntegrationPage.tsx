import { Badge } from '@thedatablitz/badge'
import { Card } from '@thedatablitz/card'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Toggle } from '@thedatablitz/toggle'
import { BookOpen, Brain, Building2, Calculator } from 'lucide-react'
import {
  useId,
  useState,
  type ComponentType,
  type PropsWithChildren,
} from 'react'
import styled from 'styled-components'
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

/** `Inline` is flex; Toggle’s label defaults to shrink:1 and can collapse to 0× width inside cards. */
const togglePreserveMd = { flexShrink: 0, minWidth: 48 } as const
const togglePreserveLg = { flexShrink: 0, minWidth: 64 } as const

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

const FooterRow = styled.footer`
  max-width: ${HERO_MAX};
  margin: ${itT('space.600')} auto 0;
  padding-top: ${itT('space.600')};
  border-top: 1px solid ${itT('color.border.DEFAULT')};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${itT('space.400')};
`

type EngineKey = 'nexus' | 'semantic' | 'adaptive' | 'quantitative'

export function IntellebitIntegrationPage() {
  const baseId = useId()
  const [engines, setEngines] = useState<Record<EngineKey, boolean>>({
    nexus: true,
    semantic: true,
    adaptive: true,
    quantitative: false,
  })

  const setEngine = (key: EngineKey, checked: boolean) => {
    setEngines((prev) => ({ ...prev, [key]: checked }))
  }

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
        </div>

        <BentoGrid>
          <BaseSettingCard variant="base" borderTone="none">
            <Stack gap="400" fullWidth>
              <Inline
                justify="space-between"
                align="flex-start"
                wrap={false}
                fullWidth
              >
                <IconTile aria-hidden>
                  <Building2 size={28} color="#000" strokeWidth={1.75} />
                </IconTile>
                <Toggle
                  id={`${baseId}-nexus`}
                  checked={engines.nexus}
                  onChange={(e) => setEngine('nexus', e.target.checked)}
                  variant="primary"
                  size="medium"
                  aria-label="Enable Nexus Structural Engine"
                  style={togglePreserveMd}
                />
              </Inline>
              <div>
                <Text
                  as="h3"
                  variant="heading4"
                  color="color.text.DEFAULT"
                  style={{
                    margin: '0 0 0.75rem',
                    fontFamily: 'Plus Jakarta Sans',
                    fontWeight: 800,
                  }}
                >
                  Nexus Structural Engine
                </Text>
                <Text
                  as="p"
                  variant="body3"
                  color="color.text.subtle"
                  style={{ margin: 0, lineHeight: 1.6 }}
                >
                  Orchestrates hierarchical curriculum mapping and automated
                  taxonomy alignment across multi-disciplinary datasets.
                </Text>
              </div>
              <Inline gap="100" wrap>
                <Badge label="MCP V4" variant="neutral" size="small" />
                <Badge label="STABLE" variant="secondary" size="small" />
              </Inline>
            </Stack>
          </BaseSettingCard>

          <BaseSettingCard variant="base" borderTone="none">
            <Stack gap="400" fullWidth>
              <Inline
                justify="space-between"
                align="flex-start"
                wrap={false}
                fullWidth
              >
                <IconTile aria-hidden>
                  <BookOpen size={28} color="#000" strokeWidth={1.75} />
                </IconTile>
                <Toggle
                  id={`${baseId}-semantic`}
                  checked={engines.semantic}
                  onChange={(e) => setEngine('semantic', e.target.checked)}
                  variant="primary"
                  size="medium"
                  aria-label="Enable Semantic Curator"
                  style={togglePreserveMd}
                />
              </Inline>
              <div>
                <Text
                  as="h3"
                  variant="heading4"
                  color="color.text.DEFAULT"
                  style={{
                    margin: '0 0 0.75rem',
                    fontWeight: 800,
                  }}
                >
                  Semantic Curator
                </Text>
                <Text
                  as="p"
                  variant="body3"
                  color="color.text.subtle"
                  style={{ margin: 0, lineHeight: 1.6 }}
                >
                  Applies advanced linguistic analysis to maintain consistent
                  academic tone and editorial rigor across all generated
                  content.
                </Text>
              </div>
              <Inline gap="100" wrap>
                <Badge label="ML-MODEL X" variant="neutral" size="small" />
                <Badge label="CORE" variant="secondary" size="small" />
              </Inline>
            </Stack>
          </BaseSettingCard>

          <SpanTwo>
            <BaseSettingCard variant="base" borderTone="none">
              <Stack gap="400" fullWidth>
                <Inline
                  justify="space-between"
                  align="flex-start"
                  wrap
                  fullWidth
                  gap="400"
                >
                  <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                    <Stack gap="300" fullWidth>
                      <Inline gap="300" align="center" wrap={false}>
                        <IconTile aria-hidden>
                          <Brain size={28} strokeWidth={1.75} />
                        </IconTile>
                        <Text
                          as="h3"
                          variant="heading4"
                          color="color.text.DEFAULT"
                          style={{
                            margin: 0,
                            fontWeight: 800,
                          }}
                        >
                          Adaptive Assessment UI
                        </Text>
                      </Inline>
                      <Text
                        as="p"
                        variant="body3"
                        color="color.text.subtle"
                        style={{
                          margin: 0,
                          lineHeight: 1.6,
                          maxWidth: '36rem',
                        }}
                      >
                        Real-time cognitive tracking module that dynamically
                        adjusts questioning complexity based on user performance
                        metrics and retention velocity.
                      </Text>
                      <Inline gap="100" wrap>
                        <Badge
                          label="BETA 0.9"
                          variant="neutral"
                          size="small"
                        />
                        <Badge label="ACTIVE" variant="primary" size="small" />
                      </Inline>
                    </Stack>
                  </div>
                  <div
                    style={{
                      flex: '0 0 auto',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: itT('space.150'),
                    }}
                  >
                    <Toggle
                      id={`${baseId}-adaptive`}
                      checked={engines.adaptive}
                      onChange={(e) => setEngine('adaptive', e.target.checked)}
                      variant="primary"
                      size="large"
                      aria-label="Enable Adaptive Assessment UI"
                      style={togglePreserveLg}
                    />
                    <Text
                      as="span"
                      variant="caption2"
                      color="color.text.subtle"
                      style={{
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {engines.adaptive ? 'Enabled' : 'Disabled'}
                    </Text>
                  </div>
                </Inline>
              </Stack>
            </BaseSettingCard>
          </SpanTwo>

          <BaseSettingCard variant="base" borderTone="none">
            <Stack gap="400" fullWidth>
              <Inline
                justify="space-between"
                align="flex-start"
                wrap={false}
                fullWidth
              >
                <IconTile aria-hidden>
                  <Calculator size={28} strokeWidth={1.75} />
                </IconTile>
                <Toggle
                  id={`${baseId}-quant`}
                  checked={engines.quantitative}
                  onChange={(e) => setEngine('quantitative', e.target.checked)}
                  variant="primary"
                  size="medium"
                  aria-label="Enable Quantitative Validator"
                  style={togglePreserveMd}
                />
              </Inline>
              <div>
                <Text
                  as="h3"
                  variant="heading4"
                  color="color.text.DEFAULT"
                  style={{
                    margin: '0 0 0.75rem',
                    fontWeight: 800,
                  }}
                >
                  Quantitative Validator
                </Text>
                <Text
                  as="p"
                  variant="body3"
                  color="color.text.subtle"
                  style={{ margin: 0, lineHeight: 1.6 }}
                >
                  Ensures mathematical integrity and data-driven accuracy within
                  technical curriculum modules and simulated environments.
                </Text>
              </div>
              <Inline gap="100" wrap>
                <Badge label="ENG_REV_2" variant="neutral" size="small" />
                <Badge label="PAUSED" variant="danger" size="small" />
              </Inline>
            </Stack>
          </BaseSettingCard>
        </BentoGrid>

        <FooterRow>
          <Inline gap="400" wrap>
            <Stack gap="050">
              <Text
                as="span"
                variant="caption2"
                color="color.text.DEFAULT"
                style={{
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                API Version
              </Text>
              <Text
                as="span"
                variant="body3"
                color="color.text.subtle"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                v4.12.8-nexus
              </Text>
            </Stack>
            <Stack gap="050">
              <Text
                as="span"
                variant="caption2"
                color="color.text.DEFAULT"
                style={{
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                Last Sync
              </Text>
              <Text
                as="span"
                variant="body3"
                color="color.text.subtle"
                style={{ fontFamily: 'ui-monospace, monospace' }}
              >
                2023-10-24 14:02:11 UTC
              </Text>
            </Stack>
          </Inline>
          <Button variant="primary" size="medium">
            Save integration config
          </Button>
        </FooterRow>
      </SettingsSubpageMain>
    </>
  )
}
