import { Stack } from '@thedatablitz/stack'
import { projectDetailMock } from '../projectDetailMock'
import { Inline } from '@thedatablitz/inline'
import { AlignLeft, Users } from 'lucide-react'
import { Text } from '@thedatablitz/text'
import { pdT } from '../pdTokens'
import { Card } from '@thedatablitz/card'
import type { ComponentType, PropsWithChildren, CSSProperties } from 'react'
import styled from 'styled-components'
import { StatusCard, TeamLeadCard } from '../../../components'
import { MetadataCard } from '../../../components/MetadataCard'
import type { ApiProjectSummary, ApiWorkspaceMember } from '../../../api'
import { useProjectAiUsage, useProjectStatusUpdates } from '../hooks'
import { MemberDetail, openDrawer } from '../../../components'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function shortDateLabel(iso: string): string {
  const d = new Date(iso)
  const ms = d.getTime()
  if (!Number.isFinite(ms)) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
}

function groupDailyIntoWeekly(
  daily: { date: string; tokens: number }[]
): { label: string; tokens: number }[] {
  if (daily.length === 0) return []
  const buckets = new Map<number, number>()
  for (const row of daily) {
    const d = new Date(row.date)
    const ms = d.getTime()
    if (!Number.isFinite(ms)) continue
    const bucket = Math.floor(ms / (7 * 24 * 60 * 60 * 1000))
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + row.tokens)
  }
  const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0])
  const tail = sorted.slice(-12)
  return tail.map(([, tokens], i) => ({ label: `w${i + 1}`, tokens }))
}

const MainGrid = styled.div`
  display: grid;
  gap: ${pdT.space400};
  grid-template-columns: 1fr;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr minmax(17.5rem, 22rem);
    align-items: start;
  }
`

const TwinGrid = styled.div`
  display: grid;
  gap: ${pdT.space200};
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
  }
`

const HealthDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${pdT.iconSuccess};
  flex-shrink: 0;
`

const ProjectSectionCard = Card as unknown as ComponentType<
  PropsWithChildren<{
    variant: 'base'
    borderTone?: 'none' | 'accent' | 'interactive'
    style?: CSSProperties
    className?: string
    'aria-labelledby'?: string
    'aria-label'?: string
  }>
>

export function ProjectOverviewTab({
  d,
  project,
  teamMembers,
}: {
  d: typeof projectDetailMock
  project: ApiProjectSummary | null
  teamMembers: ApiWorkspaceMember[]
}) {
  const lead = teamMembers[0] ?? null
  const statusUpdatesQuery = useProjectStatusUpdates(project?.id)
  const usageQuery = useProjectAiUsage(project?.id)
  const latestUpdate = statusUpdatesQuery.data?.nodes
    ?.slice()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]

  const latestStatusTitle = latestUpdate?.status ?? project?.status ?? '—'
  const latestStatusSubtitle = (() => {
    if (statusUpdatesQuery.isLoading) return 'Loading latest update…'
    if (statusUpdatesQuery.isError) return 'Failed to load latest update.'
    if (!latestUpdate) return 'No status updates yet.'
    try {
      const d = new Date(latestUpdate.createdAt)
      const formatted = new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(d)
      return `Updated ${formatted}`
    } catch {
      return 'Updated recently'
    }
  })()

  const daily = usageQuery.data?.daily ?? []
  const usageWeekly = groupDailyIntoWeekly(daily)
  const usageDaily = daily.slice(-12).map((d) => ({
    label: shortDateLabel(d.date),
    tokens: d.tokens,
  }))
  const usageChartData =
    daily.length > 12 ? usageWeekly : usageDaily

  return (
    <MainGrid>
      <Stack gap="300" fullWidth>
        <ProjectSectionCard
          variant="base"
          borderTone="none"
          aria-labelledby="pd-project-desc-heading"
          style={{ width: '100%' }}
        >
          <Stack gap="300" fullWidth>
            <Inline align="center" gap="200" wrap={false}>
              <AlignLeft
                size={22}
                strokeWidth={1.75}
                color={pdT.textSubtle}
                aria-hidden
              />
              <Text
                as="h2"
                variant="heading5"
                color="color.text.DEFAULT"
                id="pd-project-desc-heading"
                style={{ margin: 0, fontWeight: 700 }}
              >
                Project Description
              </Text>
            </Inline>
            <Text
              as="p"
              variant="body3"
              color="color.text.subtle"
              style={{ margin: 0, lineHeight: 1.65 }}
            >
              {project?.description?.trim()
                ? project.description
                : 'No description available.'}
            </Text>
            <Inline align="center" gap="150" wrap>
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                }}
              >
                Workspace
              </Text>
              <Text
                as="span"
                variant="body4"
                color="color.text.DEFAULT"
                style={{ fontWeight: 700 }}
              >
                {project?.workspaceId ?? '—'}
              </Text>
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={{ opacity: 0.5 }}
              >
                •
              </Text>
              <Inline align="center" gap="050" wrap={false}>
                <Users size={14} color={pdT.textSubtle} aria-hidden />
                <Text
                  as="span"
                  variant="caption2"
                  color="color.text.subtle"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  {teamMembers.length} members
                </Text>
              </Inline>
            </Inline>
          </Stack>
        </ProjectSectionCard>
        <TwinGrid>
          <StatusCard
            ariaLabel={d.nextMilestone.label}
            kicker={d.nextMilestone.label}
            title={d.nextMilestone.title}
            subtitle={d.nextMilestone.sub}
            titleTone="brand"
            titleVariant="heading5"
          />
          <StatusCard
            ariaLabel="Latest status"
            kicker="LATEST STATUS"
            title={latestStatusTitle}
            subtitle={latestStatusSubtitle}
            titleLeading={<HealthDot aria-hidden />}
            titleVariant="heading6"
          />
        </TwinGrid>
      </Stack>

      <Stack gap="300" fullWidth>
        <TeamLeadCard
          ariaLabel={d.teamLead.label}
          kicker={d.teamLead.label}
          name={lead?.name ?? '—'}
          title={lead?.username ? `@${lead.username}` : '—'}
          ctaLabel="VIEW PROFILE"
          onCtaClick={
            lead
              ? () => {
                  openDrawer({
                    type: 'member-detail',
                    title: lead.name,
                    children: (
                      <MemberDetail
                        member={{
                          id: lead.id,
                          name: lead.name,
                          username: lead.username || undefined,
                          avatarSrc: lead.avatarSrc,
                        }}
                      />
                    ),
                  })
                }
              : undefined
          }
        />
        <MetadataCard d={d} />
        <ProjectSectionCard
          variant="base"
          borderTone="none"
          aria-label="AI usage"
          style={{ width: '100%' }}
        >
          <div style={{ width: '100%' }}>
            <Text
              as="div"
              variant="heading6"
              color="color.text.DEFAULT"
              style={{ margin: 0, fontWeight: 700 }}
            >
              AI Token Usage
            </Text>
            <Text
              as="div"
              variant="body4"
              color="color.text.subtle"
              style={{ marginTop: 6 }}
            >
              {usageQuery.isLoading
                ? 'Loading…'
                : usageQuery.isError
                  ? 'Failed to load.'
                  : 'Last 30 days'}
            </Text>
            <div style={{ width: '100%', height: 220, marginTop: 12 }}>
              <ResponsiveContainer>
                <LineChart
                  data={usageChartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="label" tickMargin={8} interval="preserveStartEnd" />
                  <YAxis
                    width={56}
                    tickMargin={8}
                    tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke="rgba(120, 140, 255, 0.9)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={!usageQuery.isLoading}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ProjectSectionCard>
      </Stack>
    </MainGrid>
  )
}
