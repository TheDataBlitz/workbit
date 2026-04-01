import { Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Box } from '@thedatablitz/box'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import type { ComponentProps } from 'react'

type BoxPadding = NonNullable<ComponentProps<typeof Box>['padding']>

interface Props {
  message: string
  icon?: LucideIcon
  iconSize?: number
  padding?: BoxPadding
}

export function EmptyState({
  message,
  icon: Icon = Inbox,
  iconSize = 24,
  padding = '400',
}: Props) {
  return (
    <div style={{ textAlign: 'center' }}>
      <Box padding={padding}>
        <Stack gap="150" align="center">
          <span
            style={{ opacity: 0.72, lineHeight: 0, display: 'inline-block' }}
          >
            <Icon size={iconSize} strokeWidth={1.5} aria-hidden />
          </span>
          <Text variant="body3" color="color.text.subtle">
            {message}
          </Text>
        </Stack>
      </Box>
    </div>
  )
}
