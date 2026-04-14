/**
 * Inline tab strip styled with Design Bit tokens.
 *
 * MCP (`user-design-bit-components`): prefer `Tabs` from `@thedatablitz/tabs`
 * (`variant: "underline"`, `items` with `id` / `label` / `content`) once the
 * package is installable from your registry — swap this wrapper for minimal diff.
 */
import styled from 'styled-components'
import { Inline } from '@thedatablitz/inline'
import { Text } from '@thedatablitz/text'
import type { ProjectDetailTabId } from '../projectDetailMock'
import { pdT } from '../pdTokens'

const TabButton = styled.button<{ $active: boolean }>`
  margin: 0;
  padding: ${pdT.space200} ${pdT.space100};
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  transition:
    color ${pdT.motionStandard} ${pdT.motionEasing},
    box-shadow ${pdT.motionStandard} ${pdT.motionEasing};
  color: ${(p) => (p.$active ? pdT.pageFg : pdT.textSubtle)};
  opacity: ${(p) => (p.$active ? 1 : 0.65)};
  box-shadow: ${(p) =>
    p.$active
      ? `inset 0 -2px 0 0 ${pdT.brandBold}`
      : 'inset 0 -2px 0 0 transparent'};

  &:hover {
    color: ${pdT.pageFg};
    opacity: 1;
  }
`

const tabLabelStyle = {
  fontSize: 11,
  letterSpacing: '0.14em',
  fontWeight: 700,
} as const

export type ProjectDetailTabsProps = {
  tabs: readonly { id: ProjectDetailTabId; label: string }[]
  value: ProjectDetailTabId
  onChange: (id: ProjectDetailTabId) => void
}

export function ProjectDetailTabs({
  tabs,
  value,
  onChange,
}: ProjectDetailTabsProps) {
  return (
    <Inline
      role="tablist"
      aria-label="Project sections"
      gap="200"
      wrap={false}
      align="center"
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          id={`pd-tab-${tab.id}`}
          $active={value === tab.id}
          onClick={() => onChange(tab.id)}
        >
          <Text as="span" variant="caption2" style={tabLabelStyle}>
            {tab.label}
          </Text>
        </TabButton>
      ))}
    </Inline>
  )
}
