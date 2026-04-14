import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { pdT } from '../pages/project-detail/pdTokens'
import styled from 'styled-components'

const Root = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: ${pdT.space400};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`

export type DetailPanelCardProps = PropsWithChildren<{
  className?: string
  'aria-labelledby'?: string
  'aria-label'?: string
}>

const kickerStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontWeight: 700,
  opacity: 0.65,
}

export type StatusCardProps = {
  kicker: string
  title: string
  subtitle: string
  ariaLabel?: string
  /** Optional leading icon/dot shown before title. */
  titleLeading?: ReactNode
  /** Defaults match existing ProjectOverviewTab cards. */
  titleTone?: 'brand' | 'default'
  titleVariant?: 'heading5' | 'heading6'
}

export function StatusCard({
  kicker,
  title,
  subtitle,
  ariaLabel,
  titleLeading,
  titleTone = 'default',
  titleVariant = 'heading6',
}: StatusCardProps) {
  const titleStyle: CSSProperties =
    titleTone === 'brand'
      ? { margin: 0, color: pdT.brandBold, fontWeight: 800 }
      : { margin: 0, fontWeight: 700 }

  return (
    <Root aria-label={ariaLabel ?? kicker}>
      <Stack gap="150" fullWidth align="flex-start">
        <Text
          as="span"
          variant="caption2"
          color="color.text.subtle"
          style={kickerStyle}
        >
          {kicker}
        </Text>

        {titleLeading ? (
          <Inline align="center" gap="100" wrap={false}>
            {titleLeading}
            <Text
              as="span"
              variant={titleVariant}
              color="color.text.DEFAULT"
              style={titleStyle}
            >
              {title}
            </Text>
          </Inline>
        ) : (
          <Text as="span" variant={titleVariant} style={titleStyle}>
            {title}
          </Text>
        )}

        <Text
          as="span"
          variant="body4"
          color="color.text.subtle"
          style={{ margin: 0 }}
        >
          {subtitle}
        </Text>
      </Stack>
    </Root>
  )
}
