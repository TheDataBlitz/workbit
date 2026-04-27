/** Static copy for the project detail reference UI. */
export const projectDetailMock = {
  title: 'MCP Workflow',
  description:
    'Orchestration layer for model context protocols, approvals, and audit trails across workspaces.',
  badges: [
    { id: 'workspace', label: 'WORKSPACE BLITZ', variant: 'neutral' as const },
    { id: 'status', label: 'STATUS: PLANNED', variant: 'neutral' as const },
    { id: 'priority', label: 'PRIORITY: HIGH', variant: 'secondary' as const },
  ],
  tabs: [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'updates', label: 'UPDATES' },
    { id: 'issues', label: 'ISSUES' },
    { id: 'decisions', label: 'DECISIONS' },
  ] as const,
  collaborators: [{ name: 'Ada K' }, { name: 'Ben R' }, { name: 'Cara M' }],
  extraCollaborators: 8,
  executiveSummary: {
    title: 'Executive Summary',
    paragraphs: [
      'This initiative standardizes how agents and humans share tools and context, with gated promotions and full traceability.',
      'Phase one targets the internal MCP gateway; phase two extends to partner sandboxes with contract-backed scopes.',
    ],
  },
  nextMilestone: {
    label: 'NEXT MILESTONE',
    title: 'Architecture Sign-off',
    sub: 'Scheduled for Oct 24, 2023',
  },
  health: {
    label: 'HEALTH STATUS',
    status: 'On Track',
    sub: 'Last updated 2h ago',
  },
  teamLead: {
    label: 'PROJECT LEAD',
    name: 'Elena Vance',
    title: 'Senior Curator',
  },
  metadata: {
    label: 'PROJECT METADATA',
    rows: [
      { key: 'Repository', value: 'mcp-core-v2', valueAccent: true as const },
      { key: 'Budget Code', value: '#ALPHA-99', valueAccent: false as const },
      {
        key: 'Department',
        value: 'R&D / Systems',
        valueAccent: false as const,
      },
    ],
  },
  intelBar: {
    title: 'INTELLEBIT INTELLIGENCE',
    subtitle: 'Ready for workflow analysis',
    cta: 'Ask Intellebit',
  },
} as const

export type ProjectDetailTabId = (typeof projectDetailMock.tabs)[number]['id']
