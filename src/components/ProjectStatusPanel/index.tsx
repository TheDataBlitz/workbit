import { Tree } from '@design-system'

import { PanelContent } from './styles'
import type { ProjectStatusPanelProps } from './types'
import { buildProjectStatusNodes } from './utils/buildProjectStatusNodes'

export function ProjectStatusPanel({ activity }: ProjectStatusPanelProps) {
  const nodes = buildProjectStatusNodes({ activity })

  return (
    <PanelContent>
      <Tree nodes={nodes} defaultExpandedIds={['properties', 'activity']} />
    </PanelContent>
  )
}
