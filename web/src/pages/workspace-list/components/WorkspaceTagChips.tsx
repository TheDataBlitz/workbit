import { Inline } from '@thedatablitz/inline'
import type { WorkspaceListTag } from '../workspaceListData'
import { Tag } from '@thedatablitz/tags'

export type WorkspaceTagChipsProps = {
  tags: WorkspaceListTag[]
  locked: boolean
}

export function WorkspaceTagChips({ tags, locked }: WorkspaceTagChipsProps) {
  return (
    <Inline wrap gap="100">
      {tags.map((tag) => {
        if (tag.tone === 'primary') {
          return (
            <Tag key={tag.label} variant="primary">
              {tag.label}
            </Tag>
          )
        }
        if (tag.tone === 'secondary') {
          return (
            <Tag key={tag.label} variant="warning">
              {tag.label}
            </Tag>
          )
        }
        return (
          <Tag
            key={tag.label}
            variant="neutral"
            size="small"
            style={locked ? { opacity: 0.85 } : undefined}
          >
            {tag.label}
          </Tag>
        )
      })}
    </Inline>
  )
}
