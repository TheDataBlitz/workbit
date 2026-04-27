/** Static copy for the project detail Issues tab (reference UI). */

export type IssueStatusKind = 'active' | 'in_review' | 'resolved'

export type ProjectSubIssue = {
  id: string
  title: string
}

export type ProjectIssueItem = {
  id: string
  code: string
  title: string
  dueDateLabel: string
  status: IssueStatusKind
  /** Display label (e.g. from API). If omitted, derived from `status`. */
  statusLabel?: string
  /** Drives accordion left-rail tone in `@thedatablitz/accordion` metadata variant. */
  metadataTone: 'critical' | 'active' | 'neutral'
  owner: { name: string; title: string }
  linkedAssets: string[]
  subIssues: ProjectSubIssue[]
}

export const projectIssuesMock = {
  summary: [
    {
      id: 'critical',
      label: 'CRITICAL',
      value: '04',
      emphasize: true as const,
    },
    { id: 'active', label: 'ACTIVE', value: '12', emphasize: false as const },
    {
      id: 'pending',
      label: 'PENDING REVIEW',
      value: '08',
      emphasize: true as const,
    },
  ],
  listColumns: ['ID', 'ISSUE TITLE', 'DUE DATE', 'STATUS'] as const,
  issues: [
    {
      id: 'iss-001',
      code: 'ISS-001',
      title: 'Asynchronous Pipeline Deadlock in Primary Cluster',
      dueDateLabel: 'OCT 24, 2024',
      status: 'active',
      metadataTone: 'active',
      owner: { name: 'Dr. Elias Vance', title: 'PRINCIPAL ENGINEER' },
      linkedAssets: ['NODE-JS-CORE', 'KAFKA-STREAM-V2'],
      subIssues: [
        { id: 'SUB-042', title: 'Memory Leak Analysis in Stream Consumer' },
        { id: 'SUB-043', title: 'Consumer Lag Spike on Partition Rebalance' },
      ],
    },
    {
      id: 'iss-002',
      code: 'ISS-002',
      title: 'Neural Architecture Search Latency Regression',
      dueDateLabel: 'OCT 28, 2024',
      status: 'active',
      metadataTone: 'active',
      owner: { name: 'Morgan Chen', title: 'STAFF ML ENGINEER' },
      linkedAssets: ['TORCH-SERVING', 'GPU-POOL-EAST'],
      subIssues: [{ id: 'SUB-051', title: 'Batch inference queue saturation' }],
    },
    {
      id: 'iss-003',
      code: 'ISS-003',
      title: 'OAuth Scope Expansion for Partner Sandboxes',
      dueDateLabel: 'NOV 02, 2024',
      status: 'in_review',
      metadataTone: 'neutral',
      owner: { name: 'Riley Park', title: 'SECURITY ENGINEER' },
      linkedAssets: ['AUTH-GATEWAY', 'PARTNER-API'],
      subIssues: [],
    },
    {
      id: 'iss-004',
      code: 'ISS-004',
      title: 'Telemetry Dropouts on Edge Collectors v3',
      dueDateLabel: 'SEP 30, 2024',
      status: 'resolved',
      metadataTone: 'neutral',
      owner: { name: 'Sam Okonkwo', title: 'SRE LEAD' },
      linkedAssets: ['EDGE-AGENT', 'OTLP-INGEST'],
      subIssues: [],
    },
  ] satisfies ProjectIssueItem[],
} as const
