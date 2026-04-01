import { useMemo, useState } from 'react'
import { Bell, Inbox } from 'lucide-react'

import { Avatar } from '@thedatablitz/avatar'
import { Badge } from '@thedatablitz/badge'
import { Box } from '@thedatablitz/box'
import { Button, type ButtonVariant } from '@thedatablitz/button'
import { Card, CardContent, CardFooter, CardHeader } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Popup } from '@thedatablitz/popup'
import { Stack } from '@thedatablitz/stack'
import { Tabs } from '@thedatablitz/tabs'
import { Text } from '@thedatablitz/text'

function GeneralNotificationsList() {
  return (
    <Stack
      gap="100"
      fullWidth
      className="max-h-[min(60vh,420px)] overflow-y-auto"
    >
      {[1, 2, 3, 4].map((item) => (
        <Card key={item}>
          <CardHeader>
            <Avatar variant="brand" name="Zaid" size="small" />
            <Text variant="caption2" color="color.text.subtle">
              2 hours ago · Engineering
            </Text>
          </CardHeader>
          <CardContent>
            <Text variant="body3" color="color.text.DEFAULT">
              Finished up the first crack at the new dashboard! Looks really
              great. Let me know how it goes.
            </Text>
          </CardContent>
          <CardFooter>
            <Text
              variant="body3"
              as="p"
              color="color.background.information.bold"
            >
              <Text
                as="span"
                variant="body3"
                color="color.background.information.bold"
              >
                Zaid
              </Text>{' '}
              commented in{' '}
              <Text
                as="span"
                variant="body3"
                color="color.background.information.bold"
              >
                ConnectBank
              </Text>
            </Text>
          </CardFooter>
        </Card>
      ))}
    </Stack>
  )
}

function EmptyTabMessage({ message }: { message: string }) {
  return (
    <Box padding="400" fullWidth>
      <Text variant="body3" color="color.text.subtle" className="text-center">
        {message}
      </Text>
    </Box>
  )
}

export function NotificationsPopupTrigger({
  variant,
}: {
  variant: ButtonVariant
}) {
  const [tab, setTab] = useState('general')

  const tabItems = useMemo(
    () => [
      {
        id: 'general',
        label: 'General',
        content: <GeneralNotificationsList />,
      },
      {
        id: 'mentions',
        label: 'Mentions',
        content: <EmptyTabMessage message="No mentions yet." />,
      },
      {
        id: 'activity',
        label: 'Activity',
        content: <EmptyTabMessage message="No activity yet." />,
      },
      {
        id: 'archive',
        label: 'Archive',
        content: <EmptyTabMessage message="Nothing in archive." />,
      },
    ],
    []
  )

  const trigger = (
    <Button
      buttonType="icon"
      variant={variant}
      size="small"
      icon={<Bell size={15} strokeWidth={2} />}
      aria-label="Open notifications"
    />
  )

  return (
    <Popup
      trigger={trigger}
      placement="top-left"
      offset={10}
      width={420}
      minWidth={320}
      zIndex={10_000}
      showCloseButton
      closeButtonLabel="Close notifications"
      closeOnOutsideClick
      closeOnEscape
    >
      <Stack gap="200" padding="200" fullWidth>
        <Inline gap="100">
          <Text variant="heading4" as="h2">
            Notifications
          </Text>
          <Inline align="start" gap="100" wrap={false}>
            <Badge icon={<Inbox size={14} />} size="medium">
              2 unread
            </Badge>
          </Inline>
        </Inline>

        <Tabs
          items={tabItems}
          value={tab}
          onChange={setTab}
          variant="underline"
          size="medium"
        />
      </Stack>
    </Popup>
  )
}
