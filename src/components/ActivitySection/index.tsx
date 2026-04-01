import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Text } from '@thedatablitz/text'
import { SectionHeader, CollapsibleContent } from '../CollapsibleSection'
import { Timeline, TimelineItem, TimelineDot, TimelineBody } from './styles'
import type { ActivitySectionProps } from './types'
import { DEFAULT_ACTIVITY } from './utils/defaultActivity'
import { getActivityIcon } from './utils/getActivityIcon'

export type { ActivityItem } from './types'

export function ActivitySection({
  items = DEFAULT_ACTIVITY,
  defaultOpen = true,
  contentOnly = false,
}: ActivitySectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  const content = (
    <Timeline>
      {items.map((item, i) => (
        <TimelineItem
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, delay: i * 0.09 }}
        >
          <TimelineDot>{getActivityIcon(item.icon)}</TimelineDot>
          <TimelineBody>
            <Inline gap="050" align="baseline" wrap>
              <Text variant="body3" as="span">
                {item.message}
              </Text>
              <Text variant="caption2" color="color.text.subtle" as="span">
                · {item.date}
              </Text>
            </Inline>
          </TimelineBody>
        </TimelineItem>
      ))}
    </Timeline>
  )

  if (contentOnly) return content

  return (
    <div>
      <SectionHeader type="button" onClick={() => setOpen((o) => !o)}>
        <Inline align="center" justify="space-between" gap="100" fullWidth>
          <Inline align="center" gap="050">
            <ChevronDown
              size={14}
              style={{
                transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
              }}
              aria-hidden
            />
            <Text variant="body2" as="span">
              Activity
            </Text>
          </Inline>
          <Button buttonType="link" size="small" variant="primary">
            See all
          </Button>
        </Inline>
      </SectionHeader>
      <CollapsibleContent $open={open}>{content}</CollapsibleContent>
    </div>
  )
}
