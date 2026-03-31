import type { TreeNode } from '@design-system'

import { ActivitySection } from '../../ActivitySection'
import { PropertiesSection } from '../../PropertiesSection'
import type { ProjectStatusPanelProps } from '../types'

export function buildProjectStatusNodes({
  activity,
}: ProjectStatusPanelProps): TreeNode[] {
  return [
    {
      id: 'properties',
      label: 'Properties',
      content: <PropertiesSection contentOnly />,
    },
    {
      id: 'activity',
      label: 'Activity',
      content: <ActivitySection contentOnly items={activity} />,
    },
  ]
}
