import type { BadgeVariant } from '@thedatablitz/badge'

export type ProjectDecisionRow = {
  id: string
  statusLabel: string
  statusBadgeVariant: BadgeVariant
  dateLabel: string
  title: string
  authorName: string
  authorAvatarSrc?: string
  authorAvatarAlt?: string
  defaultExpanded?: boolean
  rationale: string
  impact: string
  /** Muted rejected-style row per Design Bit decision card. */
  subdued?: boolean
}

export const projectDecisionsMock = {
  watermarkLabel: 'DECISIONS',
  decisions: [
    {
      id: 'd1',
      statusLabel: 'FINALIZED',
      statusBadgeVariant: 'neutral' as const,
      dateLabel: 'OCT 24, 2023',
      title: 'Architecture Pivot: Headless CMS Integration',
      authorName: 'Elena Vance',
      defaultExpanded: true,
      rationale:
        'Vendor APIs for the legacy monolith exceeded SLOs during load tests. Moving editorial workflows to a headless layer decouples release cycles and aligns with the MCP gateway roadmap.',
      impact:
        'Editorial ships unblock within two sprints; platform group owns the integration contract. Downstream consumers migrate behind a feature flag with a six-week sunset for the old stack.',
    },
    {
      id: 'd2',
      statusLabel: 'IN REVIEW',
      statusBadgeVariant: 'warning' as const,
      dateLabel: 'OCT 18, 2023',
      title: 'Telemetry Retention Policy (90 → 180 days)',
      authorName: 'Marcus Thorne',
      defaultExpanded: false,
      rationale:
        'Compliance requested longer lookback for incident correlation. Cold storage pricing dropped after the last contract renewal, making extended retention cost-neutral.',
      impact:
        'Object store footprint grows ~18%; runbooks updated for archival tier. No change to live query dashboards.',
    },
    {
      id: 'd3',
      statusLabel: 'REJECTED',
      statusBadgeVariant: 'neutral' as const,
      dateLabel: 'OCT 02, 2023',
      title: 'Third-Party Widget Marketplace (Phase 0)',
      authorName: 'Sarah Jenkins',
      defaultExpanded: false,
      subdued: true,
      rationale:
        'Proposal opened a public submission surface before security review gates were finalized for external binaries.',
      impact:
        'Initiative parked until Q1 threat model sign-off. No production endpoints enabled.',
    },
  ] satisfies ProjectDecisionRow[],
} as const
