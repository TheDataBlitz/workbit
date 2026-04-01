import { useNavigate, useParams } from 'react-router-dom'
import { Plus, FolderKanban } from 'lucide-react'

import { PageHeader } from '@thedatablitz/page-header'
import { Box } from '@thedatablitz/box'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'

export function InboxScreen() {
  const navigate = useNavigate()
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const base = workspaceId ? `/workspace/${workspaceId}` : ''

  return (
    <Stack gap="400">
      <PageHeader
        avatar={{
          name: 'Inbox',
        }}
        title="Inbox"
        subtitle="Your notifications and updates will appear here."
      />

      <Box border padding="600" fullWidth>
        <Stack gap="300" align="center" fullWidth>
          <Text
            variant="body3"
            color="color.text.subtle"
            className="max-w-md text-center"
          >
            When you have new updates, mentions, or assignments, they&apos;ll
            appear here. Get started by creating an issue or exploring projects.
          </Text>
          <Inline gap="150">
            <Button
              variant="success"
              className="rounded-none"
              onClick={() => navigate(`${base}/issues/new`)}
            >
              <Plus size={16} aria-hidden />
              Create Issue
            </Button>
            <Button
              variant="primary"
              className="rounded-none"
              onClick={() => navigate(`${base}/workspace/projects`)}
            >
              <FolderKanban size={16} aria-hidden />
              View Projects
            </Button>
          </Inline>
        </Stack>
      </Box>
    </Stack>
  )
}
