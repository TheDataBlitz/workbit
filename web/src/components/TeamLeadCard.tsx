import type { CSSProperties } from 'react'
import { Avatar } from '@thedatablitz/avatar'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import styled from 'styled-components'
import { pdT } from '../pages/project-detail/pdTokens'

const Root = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: ${pdT.space400};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`

const kickerStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontWeight: 700,
  opacity: 0.65,
}

export type TeamLeadCardProps = {
  kicker: string
  name: string
  title: string
  ariaLabel?: string
  ctaLabel?: string
  onCtaClick?: () => void
}

export function TeamLeadCard({
  kicker,
  name,
  title,
  ariaLabel,
  ctaLabel = 'VIEW PROFILE',
  onCtaClick,
}: TeamLeadCardProps) {
  return (
    <Root aria-label={ariaLabel ?? kicker}>
      <Stack gap="300" fullWidth>
        <Text
          as="span"
          variant="caption2"
          color="color.text.subtle"
          style={kickerStyle}
        >
          {kicker}
        </Text>

        <Inline align="center" gap="200" wrap={false}>
          <Avatar variant="initials" name={name} size="large" shape="circle" />
          <Stack gap="025" align="flex-start">
            <Text
              as="span"
              variant="heading6"
              color="color.text.DEFAULT"
              style={{ margin: 0, fontWeight: 700 }}
            >
              {name}
            </Text>
            <Text
              as="span"
              variant="body4"
              color="color.text.subtle"
              style={{ margin: 0 }}
            >
              {title}
            </Text>
          </Stack>
        </Inline>

        <Button
          variant="outline"
          size="medium"
          style={{ width: '100%' }}
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Button>
      </Stack>
    </Root>
  )
}
