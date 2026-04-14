import type { ReactNode } from 'react'
import { Badge } from '@thedatablitz/badge'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'

export type IntegrationEnableRowProps = {
  title: ReactNode
  description?: ReactNode
  enabled: boolean
  enabledLabel?: string
  extraBadges?: ReactNode
  onToggle: () => void
  enableText?: string
  disableText?: string
  ariaLabel?: string
  titleVariant?: 'body2' | 'body3'
}

export function IntegrationEnableRow({
  title,
  description,
  enabled,
  enabledLabel = 'ENABLED',
  extraBadges,
  onToggle,
  enableText = 'Enable',
  disableText = 'Disable',
  ariaLabel,
  titleVariant = 'body3',
}: IntegrationEnableRowProps) {
  return (
    <Inline justify="space-between" align="center" wrap={false} fullWidth>
      <div style={{ minWidth: 0 }}>
        <Stack gap="050" fullWidth>
          <Inline gap="150" align="center" wrap={false}>
            <Text
              as="div"
              variant={titleVariant}
              color="color.text.DEFAULT"
              truncate
              style={{ fontWeight: 800 }}
            >
              {title}
            </Text>
            {enabled ? (
              <Badge label={enabledLabel} variant="primary" size="small" />
            ) : null}
            {extraBadges}
          </Inline>
          {description ? (
            <Text
              as="div"
              variant="caption1"
              color="color.text.subtle"
              truncate
              style={{ maxWidth: '32rem' }}
            >
              {description}
            </Text>
          ) : null}
        </Stack>
      </div>

      <Button
        variant={enabled ? 'primary' : 'outline'}
        size="small"
        aria-label={ariaLabel}
        onClick={onToggle}
      >
        {enabled ? disableText : enableText}
      </Button>
    </Inline>
  )
}
