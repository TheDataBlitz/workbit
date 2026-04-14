import type { CSSProperties } from 'react'
import styled, { keyframes } from 'styled-components'
import { Box } from '@thedatablitz/box'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { ChevronRight, Lock } from 'lucide-react'
import type { ApiWorkspace } from '../../../types/workspace'
import type { WorkspaceListRow } from '../workspaceListData'
import { protocolLabel } from '../workspaceListUtils'
import { WorkspaceTagChips } from './WorkspaceTagChips'
import { wlT } from './wlTokens'

/** Stitch export uses ~500ms transitions on workspace tiles. */
const CARD_MS = '500ms'

const pulseSoft = keyframes`
  50% {
    opacity: 0.45;
  }
`

const CardAccentBar = styled.div<{
  $accent: 'primary' | 'secondary'
  $baseOpacity: number
}>`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  pointer-events: none;
  opacity: ${(p) => p.$baseOpacity};
  background: linear-gradient(
    90deg,
    ${(p) => (p.$accent === 'primary' ? wlT.brandBold : wlT.secondaryStrong)},
    transparent
  );
  transition: opacity ${CARD_MS} ${wlT.motionEasing};
`

const WorkspaceCardBox = styled(Box).attrs({
  padding: '400',
})<{
  $visual: WorkspaceListRow['visualState']
}>`
  position: relative;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  min-height: 240px;

  border-radius: ${wlT.radiusMd};
  cursor: ${(p) => (p.$visual === 'locked' ? 'not-allowed' : 'pointer')};
  border: 1px solid color-mix(in srgb, ${wlT.border} 25%, transparent);
  /* Stitch: glass-card rgba(28,27,27,0.4) over surface-container-low */
  background: color-mix(in srgb, ${wlT.surfaceCard} 40%, transparent);
  backdrop-filter: ${wlT.blurLg};
  transition:
    border-color ${CARD_MS} ${wlT.motionEasing},
    transform ${CARD_MS} ${wlT.motionEasing},
    box-shadow ${CARD_MS} ${wlT.motionEasing},
    opacity ${CARD_MS} ${wlT.motionEasing},
    filter ${CARD_MS} ${wlT.motionEasing};

  ${(p) =>
    p.$visual === 'active'
      ? `
    box-shadow: 0 0 20px -5px color-mix(in srgb, ${wlT.brandBold} 15%, transparent);
    border-color: color-mix(in srgb, ${wlT.brandBold} 30%, transparent);
  `
      : ''}

  ${(p) =>
    p.$visual === 'locked'
      ? `
    opacity: 0.6;
    filter: grayscale(0.4);
    border-color: color-mix(in srgb, ${wlT.border} 12%, transparent);
  `
      : ''}

  &:hover {
    ${(p) =>
      p.$visual === 'locked'
        ? `
      opacity: 0.68;
    `
        : `
      border-color: color-mix(in srgb, ${wlT.brandBold} 60%, transparent);
    `}
  }

  &:hover .wl-card-accent {
    opacity: 1;
  }

  &:active {
    ${(p) =>
      p.$visual !== 'locked'
        ? `
      transform: scale(0.98);
    `
        : ''}
  }

  &:hover .wl-chevron {
    color: ${wlT.brandBold};
    transform: translateX(4px);
  }

  &:hover .wl-title {
    color: ${wlT.brandBold};
  }
`

/** Stitch: first row uses mb-auto so title + tags sit toward the bottom of the square. */
const CardHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  flex-shrink: 0;
`

const CardBodyBlock = styled.div`
  width: 100%;
  flex-shrink: 0;
`

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${wlT.brandBold};
  animation: ${pulseSoft} 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`

const protocolSmallStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginTop: '0.25rem',
  color: wlT.textSubtle,
  opacity: 0.4,
}

const protocolRowStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: wlT.textSubtle,
  opacity: 0.6,
}

const protocolLockedStyle: CSSProperties = {
  ...protocolRowStyle,
  opacity: 0.4,
}

const activeInstanceStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: wlT.brandBold,
}

const chevronIconStyle: CSSProperties = {
  width: '1.25rem',
  height: '1.25rem',
  color: wlT.iconSubtle,
  transition: `color ${CARD_MS} ${wlT.motionEasing}, transform ${CARD_MS} ${wlT.motionEasing}`,
}

const lockIconStyle: CSSProperties = {
  width: 16,
  height: 16,
  color: wlT.iconSubtle,
  opacity: 0.6,
  flexShrink: 0,
}

const cardTitleStyle: CSSProperties = {
  margin: 0,
  marginBottom: wlT.space100,
  fontSize: '1.875rem',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: 1.15,
  transition: `color ${CARD_MS} ${wlT.motionEasing}`,
  fontFamily: `'Plus Jakarta Sans', Inter, system-ui, sans-serif`,
}

const cardDescStyle: CSSProperties = {
  margin: 0,
  marginBottom: '2rem',
  fontSize: '0.75rem',
  lineHeight: 1.625,
  color: wlT.textSubtle,
  opacity: 0.7,
}

export type WorkspaceCardProps = {
  row: WorkspaceListRow
  onSelect?: (workspace: ApiWorkspace) => void
}

export function WorkspaceCard({ row, onSelect }: WorkspaceCardProps) {
  const locked = row.visualState === 'locked'

  return (
    <WorkspaceCardBox
      fullWidth
      $visual={row.visualState}
      onClick={() => {
        if (!locked) onSelect?.(row)
      }}
    >
      <CardHeaderRow>
        <Inline
          justify="space-between"
          align="flex-start"
          fullWidth
          wrap={false}
        >
          {row.visualState === 'active' ? (
            <Stack gap="050">
              <Text as="span" variant="caption2" style={activeInstanceStyle}>
                Active Instance
              </Text>
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={protocolSmallStyle}
              >
                {protocolLabel(row.protocol)}
              </Text>
            </Stack>
          ) : locked ? (
            <Inline align="center" gap="050" wrap={false}>
              <Lock aria-hidden style={lockIconStyle} strokeWidth={2} />
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={protocolLockedStyle}
              >
                {protocolLabel(row.protocol)}
              </Text>
            </Inline>
          ) : (
            <Text
              as="span"
              variant="caption2"
              color="color.text.subtle"
              style={protocolRowStyle}
            >
              {protocolLabel(row.protocol)}
            </Text>
          )}
          {!locked ? (
            <Inline align="center" gap="050" wrap={false}>
              {row.visualState === 'active' ? <StatusDot aria-hidden /> : null}
              <ChevronRight
                className="wl-chevron"
                aria-hidden
                style={chevronIconStyle}
                strokeWidth={2}
              />
            </Inline>
          ) : null}
        </Inline>
      </CardHeaderRow>

      <CardBodyBlock>
        <Text
          as="h3"
          variant="heading4"
          color={locked ? 'color.text.subtle' : 'color.text.DEFAULT'}
          className="wl-title"
          style={locked ? { ...cardTitleStyle, opacity: 0.6 } : cardTitleStyle}
        >
          {row.name}
        </Text>
        <Text
          as="p"
          variant="body4"
          color="color.text.subtle"
          style={locked ? { ...cardDescStyle, opacity: 0.4 } : cardDescStyle}
        >
          {row.description}
        </Text>
        <WorkspaceTagChips tags={row.tags} locked={locked} />
      </CardBodyBlock>

      {!locked ? (
        <CardAccentBar
          className="wl-card-accent"
          $accent={row.visualState === 'syncing' ? 'secondary' : 'primary'}
          $baseOpacity={row.visualState === 'active' ? 0.4 : 0}
        />
      ) : null}
    </WorkspaceCardBox>
  )
}
