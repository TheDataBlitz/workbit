import type { TreeNode } from '@thedatablitz/tree'
import type { ReactNode } from 'react'

import { ActivitySection } from '../../ActivitySection'
import { PropertiesSection } from '../../PropertiesSection'
import type { ProjectStatusPanelProps } from '../types'

/** Prevents tree row selection when interacting with section content. */
function sectionBody(children: ReactNode) {
  return (
    <div
      role="presentation"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

export function buildProjectStatusNodes({
  activity,
}: ProjectStatusPanelProps): TreeNode[] {
  return [
    {
      id: 'properties',
      label: 'Properties',
      children: [
        {
          id: 'properties-body',
          label: sectionBody(<PropertiesSection contentOnly />),
        },
      ],
    },
    {
      id: 'activity',
      label: 'Activity',
      children: [
        {
          id: 'activity-body',
          label: sectionBody(<ActivitySection contentOnly items={activity} />),
        },
      ],
    },
  ]
}
