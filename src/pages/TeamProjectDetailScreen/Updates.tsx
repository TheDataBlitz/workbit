import { Box } from '@thedatablitz/box'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'

import { StatusUpdateComposer, UpdatesTree } from '../../components'
import { noop } from '../../utils/noop'
import type { UseProjectDetailUpdatesResult } from './hooks/useProjectDetail'

export type { UseProjectDetailUpdatesResult } from './hooks/useProjectDetail'
export {
  useProjectDetailUpdates,
  teamProjectUpdatesQueryKey,
} from './hooks/useProjectDetail'

export type ProjectDetailUpdatesTabProps = Pick<
  UseProjectDetailUpdatesResult,
  'updatesTreeItems' | 'handleAddComment' | 'handlePostUpdate' | 'isLoading'
>

export function ProjectDetailUpdatesTab({
  updatesTreeItems,
  handleAddComment,
  handlePostUpdate,
  isLoading,
}: ProjectDetailUpdatesTabProps) {
  return (
    <Box border padding="400">
      <Stack gap="300">
        {isLoading ? (
          <Text variant="body3" color="color.text.subtle">
            Loading updates…
          </Text>
        ) : (
          <UpdatesTree
            updates={updatesTreeItems}
            enableSearch={false}
            onAddComment={handleAddComment}
            onReact={noop}
          />
        )}
        <StatusUpdateComposer
          placeholder="Write a project update..."
          onPost={handlePostUpdate}
          onChooseFile={noop}
          onCreateDocument={noop}
          onAddLink={noop}
        />
      </Stack>
    </Box>
  )
}
