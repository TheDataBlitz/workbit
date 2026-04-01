import { useCallback, useState } from 'react'
import { Tree } from '@thedatablitz/tree'

import { PanelContent } from './styles'
import type { ProjectStatusPanelProps } from './types'
import { buildProjectStatusNodes } from './utils/buildProjectStatusNodes'

const DEFAULT_EXPANDED_IDS = ['properties', 'activity'] as const

export function ProjectStatusPanel({ activity }: ProjectStatusPanelProps) {
  const nodes = buildProjectStatusNodes({ activity })
  const [expandedIds, setExpandedIds] = useState<string[]>([
    ...DEFAULT_EXPANDED_IDS,
  ])

  const onToggle = useCallback((id: string, expanded: boolean) => {
    setExpandedIds((prev) =>
      expanded
        ? prev.includes(id)
          ? prev
          : [...prev, id]
        : prev.filter((x) => x !== id)
    )
  }, [])

  return (
    <PanelContent>
      <Tree
        className="min-w-0 w-full"
        nodes={nodes}
        expandedIds={expandedIds}
        onToggle={onToggle}
        selectedIds={[]}
        size="small"
        variant="primary"
      />
    </PanelContent>
  )
}
