import styled from 'styled-components'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Sparkles } from 'lucide-react'
import { pdT } from '../pdTokens'

const Bar = styled.div`
  position: fixed;
  z-index: 50;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(720px, calc(100% - 2rem));
  box-sizing: border-box;
  padding: ${pdT.space300} ${pdT.space400};
  background: ${pdT.surfaceOverlay};
  border: 1px solid ${pdT.border};
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
`

const IconTile = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  background: ${pdT.brandBold};
  color: ${pdT.onPrimary};
  flex-shrink: 0;
`

export type ProjectIntelBitBarProps = {
  title: string
  subtitle: string
  ctaLabel: string
  onCta?: () => void
}

export function ProjectIntelBitBar({
  title,
  subtitle,
  ctaLabel,
  onCta,
}: ProjectIntelBitBarProps) {
  return (
    <Bar role="region" aria-label="Intellebit assistant">
      <Inline justify="space-between" align="center" gap="300" wrap fullWidth>
        <Inline align="center" gap="300" wrap={false}>
          <IconTile aria-hidden>
            <Sparkles size={22} strokeWidth={2} />
          </IconTile>
          <Stack gap="050" align="flex-start">
            <Text
              as="span"
              variant="caption2"
              color="color.text.DEFAULT"
              style={{
                fontSize: 11,
                letterSpacing: '0.12em',
                fontWeight: 800,
              }}
            >
              {title}
            </Text>
            <Text
              as="span"
              variant="caption2"
              color="color.text.subtle"
              style={{ fontSize: 12, opacity: 0.85 }}
            >
              {subtitle}
            </Text>
          </Stack>
        </Inline>
        <Button
          variant="primary"
          size="medium"
          onClick={onCta}
          style={{ flexShrink: 0 }}
        >
          {ctaLabel}
        </Button>
      </Inline>
    </Bar>
  )
}
