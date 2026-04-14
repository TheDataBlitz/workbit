import type {
  ComponentType,
  CSSProperties,
  PropsWithChildren,
  ReactNode,
} from 'react'
import { Card } from '@thedatablitz/card'
import { Text } from '@thedatablitz/text'
import type { ProjectDecisionRow } from '../pages/project-detail/projectDecisionsMock'

type DecisionCardProps = PropsWithChildren<{
  variant: 'decision'
  statusLabel: string
  statusBadgeVariant?: ProjectDecisionRow['statusBadgeVariant']
  dateLabel: string
  title: string
  authorName: string
  authorAvatarSrc?: string
  authorAvatarAlt?: string
  loggedByPrefix?: string
  expanded?: boolean
  defaultExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  rationaleSectionTitle?: string
  rationale?: ReactNode
  impactSectionTitle?: string
  impact?: ReactNode
  subdued?: boolean
  showToggle?: boolean
  style?: CSSProperties
  className?: string
}>

/**
 * Published `Card` types in this repo still target the legacy API; runtime
 * `variant="decision"` matches `DecisionCardFields` from the Design Bit catalog.
 */
const DecisionCard = Card as unknown as ComponentType<DecisionCardProps>

function BodyParagraph({ text }: { text: string }) {
  return (
    <Text
      as="p"
      variant="body3"
      color="color.text.subtle"
      style={{ margin: 0, lineHeight: 1.65 }}
    >
      {text}
    </Text>
  )
}

export type ProjectDecisionCardProps = {
  row: ProjectDecisionRow
}

export function ProjectDecisionCard({ row }: ProjectDecisionCardProps) {
  return (
    <DecisionCard
      variant="decision"
      statusLabel={row.statusLabel}
      statusBadgeVariant={row.statusBadgeVariant}
      dateLabel={row.dateLabel}
      title={row.title}
      authorName={row.authorName}
      {...(row.authorAvatarSrc
        ? {
            authorAvatarSrc: row.authorAvatarSrc,
            authorAvatarAlt: row.authorAvatarAlt ?? row.authorName,
          }
        : {})}
      defaultExpanded={row.defaultExpanded}
      rationaleSectionTitle="RATIONALE"
      rationale={<BodyParagraph text={row.rationale} />}
      impactSectionTitle="IMPACT"
      impact={<BodyParagraph text={row.impact} />}
      subdued={row.subdued}
      style={{ width: '100%' }}
    />
  )
}
