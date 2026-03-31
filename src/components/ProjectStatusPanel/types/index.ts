import type { ActivitySection } from '../../ActivitySection'

export type ProjectStatusPanelProps = {
  /** Optional activity list override. */
  activity?: React.ComponentProps<typeof ActivitySection>['items']
}
