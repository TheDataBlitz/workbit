import { Banner } from '@thedatablitz/banner'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'

import {
  ProjectUpdateHighlightCard,
  StatusUpdateComposer,
  UpdatesTree,
} from '../../components'
import { noop } from '../../utils/noop'
import type { UseProjectDetailUpdatesResult } from './hooks/useProjectDetail'

export type ProjectDetailOverviewStatusProps = Pick<
  UseProjectDetailUpdatesResult,
  | 'updates'
  | 'featuredUpdate'
  | 'updatesTreeItems'
  | 'handleAddComment'
  | 'handlePostUpdate'
  | 'isLoading'
>

export function ProjectDetailOverviewStatus({
  updates,
  featuredUpdate,
  updatesTreeItems,
  handleAddComment,
  handlePostUpdate,
  isLoading,
}: ProjectDetailOverviewStatusProps) {
  return (
    <Stack>
      {isLoading ? (
        <Text variant="body3" color="color.text.subtle">
          Loading updates…
        </Text>
      ) : updates.length === 0 ? (
        <Banner
          size="small"
          variant="info"
          title="Write the first project update to get started"
        />
      ) : (
        <>
          <ProjectUpdateHighlightCard
            update={featuredUpdate}
            onAddComment={handleAddComment}
          />
          <UpdatesTree
            updates={updatesTreeItems}
            enableSearch={false}
            onAddComment={handleAddComment}
            onReact={noop}
          />
        </>
      )}

      <StatusUpdateComposer
        placeholder="Write first project update"
        onPost={handlePostUpdate}
      />
    </Stack>
  )
}
