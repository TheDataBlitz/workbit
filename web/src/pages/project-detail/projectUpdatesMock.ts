import type { BadgeVariant } from '@thedatablitz/badge'

export type UpdateFeedItem =
  | {
      id: string
      kind: 'completed'
      author: { name: string; role: string; time: string }
      statusLabel: string
      statusBadgeVariant: BadgeVariant
      title: string
      body: string
      tags: string[]
    }
  | {
      id: string
      kind: 'in_progress'
      author: { name: string; role: string; time: string }
      statusLabel: string
      statusBadgeVariant: BadgeVariant
      title: string
      body: string
      attachments: { label: string; variant: 'infra' | 'code' }[]
    }
  | {
      id: string
      kind: 'archived'
      author: { name: string; role: string; time: string }
      statusLabel: string
      statusBadgeVariant: BadgeVariant
      quoteBody: string
    }

export const projectUpdatesMock = {
  feed: [
    {
      id: 'u1',
      kind: 'completed' as const,
      author: {
        name: 'Dr. Elena Vance',
        role: 'LEAD RESEARCHER',
        time: '2H AGO',
      },
      statusLabel: 'COMPLETED',
      statusBadgeVariant: 'secondary' as const,
      title: 'Phase 02 Architecture Finalized',
      body: 'The structural framework for the Mobile Workspace Selector has been approved by the steering committee. All pedagogical feedback from the beta cohort has been integrated into the specification.',
      tags: ['Curriculum Design', 'AI Research'],
    },
    {
      id: 'u2',
      kind: 'in_progress' as const,
      author: {
        name: 'Marcus Thorne',
        role: 'SYSTEM ARCHITECT',
        time: '5H AGO',
      },
      statusLabel: 'IN PROGRESS',
      statusBadgeVariant: 'warning' as const,
      title: 'Neural Engine Optimization',
      body: 'Refactoring the primary data ingestion pipeline to support sub-50ms latency for context window hydration. Early benchmarks show a 22% reduction in cold-start times across edge nodes.',
      attachments: [
        { label: 'INFRASTRUCTURE.JPG', variant: 'infra' as const },
        { label: 'PIPELINE_FINAL.PNG', variant: 'code' as const },
      ],
    },
    {
      id: 'u3',
      kind: 'archived' as const,
      author: {
        name: 'Sarah Jenkins',
        role: 'PROJECT COORDINATOR',
        time: 'YESTERDAY',
      },
      statusLabel: 'ARCHIVED',
      statusBadgeVariant: 'neutral' as const,
      quoteBody:
        'Stakeholder sync moved to Tuesday 10:00 AM EST. Please review the revised agenda in the shared drive before the session.',
    },
  ] satisfies UpdateFeedItem[],

  activity: {
    title: 'ACTIVITY INSIGHTS',
    chartLabel: 'UPDATE FREQUENCY',
    /** Bar heights as % of chart area (max). */
    barHeights: [35, 55, 40, 70, 45, 90] as const,
    accentBarIndex: 3 as const,
    trendLabel: 'Trending Upward',
    trendValue: '+12%',
    stats: [
      { label: 'TOTAL UPDATES', value: '128', emphasize: false },
      { label: 'CONTRIBUTORS', value: '14', emphasize: false },
      { label: 'HEALTH SCORE', value: '98/100', emphasize: true },
    ],
  },

  globalTags: {
    title: 'GLOBAL TAGS',
    tags: [
      '#MILESTONE_A',
      '#SYSTEM_REFACTOR',
      '#Q4_GOALS',
      '#PEDAGOGY',
      '#API_V2',
    ],
  },

  activeTeam: {
    title: 'ACTIVE TEAM',
    members: [
      {
        name: 'Elena V.',
        status: 'ACTIVE' as const,
        presence: 'active' as const,
      },
      {
        name: 'Marcus T.',
        status: 'ACTIVE' as const,
        presence: 'active' as const,
      },
      { name: 'Sarah J.', status: 'AWAY' as const, presence: 'away' as const },
      {
        name: 'David L.',
        status: 'OFFLINE' as const,
        presence: 'offline' as const,
      },
    ],
  },
} as const
