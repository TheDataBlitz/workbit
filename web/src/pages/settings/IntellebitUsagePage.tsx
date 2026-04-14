import {
  BreakdownChart,
  ConsumptionBarChart,
  type ConsumptionBarDatum,
  UsageMetricCard,
} from '@thedatablitz/chart'
import { useState } from 'react'
import styled from 'styled-components'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { SettingsSubpageMain } from './settingsSubpageChrome'
import { useAiUsage } from './hooks'

function formatCompactNumber(n: number): { value: string; suffix: string } {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000)
    return { value: (n / 1_000_000_000).toFixed(2), suffix: 'B' }
  if (abs >= 1_000_000)
    return { value: (n / 1_000_000).toFixed(2), suffix: 'M' }
  if (abs >= 1_000) return { value: (n / 1_000).toFixed(1), suffix: 'k' }
  return { value: String(Math.round(n)), suffix: '' }
}

function shortDateLabel(iso: string): string {
  const d = new Date(iso)
  const ms = d.getTime()
  if (!Number.isFinite(ms)) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' })
}

function groupDailyIntoWeekly(
  daily: { date: string; tokens: number }[]
): ConsumptionBarDatum[] {
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
  return tail.map(([, tokens], i) => ({ label: `w${i + 1}`, value: tokens }))
}

function groupDailySeriesIntoWeekly(
  daily: { date: string; value: number }[]
): ConsumptionBarDatum[] {
  if (daily.length === 0) return []
  const buckets = new Map<number, number>()
  for (const row of daily) {
    const d = new Date(row.date)
    const ms = d.getTime()
    if (!Number.isFinite(ms)) continue
    const bucket = Math.floor(ms / (7 * 24 * 60 * 60 * 1000))
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + row.value)
  }
  const sorted = [...buckets.entries()].sort((a, b) => a[0] - b[0])
  const tail = sorted.slice(-12)
  return tail.map(([, value], i) => ({ label: `w${i + 1}`, value }))
}

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`

export function IntellebitUsagePage() {
  const [granularity, setGranularity] = useState('weekly')
  const usage = useAiUsage({ days: 30 })

  const totalsTokens = usage.data?.totals.tokens ?? 0
  const totalsPromptTokens = usage.data?.totals.promptTokens ?? 0
  const totalsCompletionTokens = usage.data?.totals.completionTokens ?? 0
  const totalsRequests = usage.data?.totals.requests ?? 0
  const days = usage.data?.days ?? 30

  const totalTokens = formatCompactNumber(totalsTokens)
  const totalInputTokens = formatCompactNumber(totalsPromptTokens)
  const totalOutputTokens = formatCompactNumber(totalsCompletionTokens)
  const avgDaily = formatCompactNumber(days > 0 ? totalsTokens / days : 0)
  const monthlyBudget = usage.data?.monthlyBudget ?? null
  const projectedMonthlyIntelebits = monthlyBudget
    ? (monthlyBudget.usedIntelebits / Math.max(1, days)) * 30
    : null
  const projected = formatCompactNumber(projectedMonthlyIntelebits ?? 0)

  const daily = usage.data?.daily ?? []
  const consumptionData: ConsumptionBarDatum[] =
    granularity === 'daily'
      ? daily
          .slice(-12)
          .map((d) => ({ label: shortDateLabel(d.date), value: d.tokens }))
      : groupDailyIntoWeekly(daily)

  const dailyInput = daily.map((d) => ({
    date: d.date,
    value: d.promptTokens ?? 0,
  }))
  const dailyOutput = daily.map((d) => ({
    date: d.date,
    value: d.completionTokens ?? 0,
  }))

  const consumptionInput: ConsumptionBarDatum[] =
    granularity === 'daily'
      ? dailyInput
          .slice(-12)
          .map((d) => ({ label: shortDateLabel(d.date), value: d.value }))
      : groupDailySeriesIntoWeekly(dailyInput)

  const consumptionOutput: ConsumptionBarDatum[] =
    granularity === 'daily'
      ? dailyOutput
          .slice(-12)
          .map((d) => ({ label: shortDateLabel(d.date), value: d.value }))
      : groupDailySeriesIntoWeekly(dailyOutput)

  const byShop = usage.data?.byShop ?? []
  const breakdownRows =
    totalsTokens > 0
      ? byShop
          .slice()
          .sort((a, b) => b.tokens - a.tokens)
          .slice(0, 6)
          .map((s, idx) => ({
            id: s.shopId,
            title: s.shopId,
            subtitle: `${s.requests} requests`,
            percent:
              Math.round(
                ((s.tokens / totalsTokens) * 100 + Number.EPSILON) * 10
              ) / 10,
            valueLabel:
              formatCompactNumber(s.tokens).value +
              formatCompactNumber(s.tokens).suffix,
            valueHint: 'Tokens Allocated',
            variant: idx === 0 ? ('primary' as const) : ('muted' as const),
          }))
      : []

  return (
    <>
      <SettingsSubpageMain>
        {usage.isError ? (
          <Stack gap="150" fullWidth>
            <Text
              as="h2"
              variant="heading5"
              color="color.text.DEFAULT"
              style={{ margin: 0 }}
            >
              Unable to load usage
            </Text>
            <Text
              as="p"
              variant="body3"
              color="color.text.subtle"
              style={{ margin: 0 }}
            >
              Please try again.
            </Text>
          </Stack>
        ) : null}

        <MetricGrid>
          <UsageMetricCard
            label="Total Tokens Used"
            primaryValue={totalTokens.value}
            primarySuffix={totalTokens.suffix}
            footnote={`${totalsRequests} requests • Input ${totalInputTokens.value}${totalInputTokens.suffix} • Output ${totalOutputTokens.value}${totalOutputTokens.suffix}`}
            footnoteTone="neutral"
          />
          <UsageMetricCard
            label="Avg. Daily Usage"
            primaryValue={avgDaily.value}
            primarySuffix={avgDaily.suffix}
            footnote={`Based on last ${days} days`}
            footnoteTone="neutral"
          />
          <UsageMetricCard
            label="Projected Burn"
            primaryValue={projected.value}
            primarySuffix={projected.suffix}
            footnote={
              monthlyBudget
                ? `${monthlyBudget.usagePercent}% of monthly cap used`
                : 'Monthly cap not configured'
            }
            footnoteTone={
              monthlyBudget && monthlyBudget.usagePercent >= 85
                ? 'warning'
                : 'neutral'
            }
            emphasized
          />
        </MetricGrid>

        <div style={{ marginBottom: '3rem' }}>
          <ConsumptionBarChart
            data={consumptionData}
            height={320}
            title="Consumption Velocity"
            subtitle={usage.isLoading ? 'Loading…' : 'Token usage over time'}
            granularity={granularity}
            onGranularityChange={setGranularity}
            granularityOptions={[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
            ]}
            timelineLabels={[]}
            formatValue={(v) => `${Math.round(v / 1000)}k`}
          />
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <ConsumptionBarChart
            data={consumptionInput}
            height={280}
            title="Input Tokens (Prompt)"
            subtitle={usage.isLoading ? 'Loading…' : 'Prompt tokens over time'}
            granularity={granularity}
            onGranularityChange={setGranularity}
            granularityOptions={[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
            ]}
            timelineLabels={[]}
            formatValue={(v) => `${Math.round(v / 1000)}k`}
          />
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <ConsumptionBarChart
            data={consumptionOutput}
            height={280}
            title="Output Tokens (Completion)"
            subtitle={
              usage.isLoading ? 'Loading…' : 'Completion tokens over time'
            }
            granularity={granularity}
            onGranularityChange={setGranularity}
            granularityOptions={[
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
            ]}
            timelineLabels={[]}
            formatValue={(v) => `${Math.round(v / 1000)}k`}
          />
        </div>

        <BreakdownChart
          rows={breakdownRows}
          sectionTitle="Workspace Breakdown"
          sectionBadge={usage.isLoading ? 'Loading' : 'Live Data'}
        />
      </SettingsSubpageMain>
    </>
  )
}
