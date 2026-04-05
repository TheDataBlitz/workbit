import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, type CardVariant } from '@thedatablitz/card'
import { BarGraph, type BarGraphDatum } from '@thedatablitz/chart'
import { Dropdown } from '@thedatablitz/dropdown'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Table, type ColumnDef } from '@thedatablitz/table'
import { Text } from '@thedatablitz/text'
import { fetchMeAiUsage, type ApiMeAiUsageByShop } from '../../api/client'

type TimeRangeValue = 'last-7' | 'last-30' | 'last-90'

const ALL_SHOPS = '__all__'
/** Same as API billing: 100 tokens = 1 Intelebit. */
const TOKENS_PER_INTELEBIT = 100

function tokensToIntelebits(tokens: number): number {
  return tokens / TOKENS_PER_INTELEBIT
}

type UsagePoint = {
  dateLabel: string
  value: number
}

type ShopTableRow = {
  id: string
  shopLabel: string
  requests: number
  intelebits: number
}

function formatInt(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
}

function formatIntelebits(n: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

function shortShopId(shopId: string) {
  const t = shopId.trim()
  if (t.length <= 14) return t
  return `${t.slice(0, 8)}…${t.slice(-4)}`
}

type UsageTone = 'ok' | 'warning' | 'danger'

function usageToneFromPercent(percent: number): UsageTone {
  if (percent >= 90) return 'danger'
  if (percent >= 70) return 'warning'
  return 'ok'
}

const BAR_COLOR: Record<UsageTone, string> = {
  ok: '#0f172a',
  warning: '#d97706',
  danger: '#dc2626',
}

function metricCardVariant(tone: UsageTone): CardVariant {
  if (tone === 'danger') return 'danger'
  if (tone === 'warning') return 'warning'
  return 'default'
}

/** One bar per calendar day (UTC); missing days are zero. */
function buildChartPoints(
  days: number,
  daily: { date: string; tokens: number }[]
): UsagePoint[] {
  const byDate = new Map<string, number>()
  for (const row of daily) {
    const key = row.date.slice(0, 10)
    byDate.set(key, (byDate.get(key) ?? 0) + row.tokens)
  }
  const out: UsagePoint[] = []
  const end = new Date()
  end.setUTCHours(0, 0, 0, 0)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - i)
    )
    const key = d.toISOString().slice(0, 10)
    const tokens = byDate.get(key) ?? 0
    const dateLabel = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    out.push({ dateLabel, value: tokensToIntelebits(tokens) })
  }
  return out
}

function IntelebitsUsageChart({
  points,
  tone,
}: {
  points: UsagePoint[]
  tone: UsageTone
}) {
  const data = useMemo<BarGraphDatum[]>(
    () => points.map((p) => ({ label: p.dateLabel, value: p.value })),
    [points]
  )
  const barColor = BAR_COLOR[tone]

  return (
    <Stack gap="100">
      <Text variant="heading5">Intelebits by day</Text>
      <Text variant="caption1" color="color.text.subtle">
        Bar color follows workspace monthly cap: ≥70% warning, ≥90% danger.
      </Text>
      <Card
        size="medium"
        variant={metricCardVariant(tone)}
        type="bordered"
        fullWidth
      >
        <CardContent>
          {points.length === 0 ? (
            <Text variant="body3" color="color.text.subtle">
              No data in this range.
            </Text>
          ) : (
            <BarGraph data={data} height={320} barColor={barColor} />
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

function MetricTile({
  label,
  helper,
  value,
  tone,
}: {
  label: string
  helper: string
  value: string
  tone: UsageTone
}) {
  return (
    <Card
      size="small"
      variant={metricCardVariant(tone)}
      type="bordered"
      fullWidth
      className="min-w-[140px] flex-1"
    >
      <CardContent>
        <Stack gap="050">
          <Text variant="caption2" color="color.text.subtle">
            {label}
          </Text>
          <Text variant="heading6">{value}</Text>
          <Text variant="caption2" color="color.text.subtle">
            {helper}
          </Text>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function ProfileUsageTab() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('last-30')
  const [shopFilter, setShopFilter] = useState<string>(ALL_SHOPS)

  const days = timeRange === 'last-7' ? 7 : timeRange === 'last-90' ? 90 : 30

  const allUsageQuery = useQuery({
    queryKey: ['me', 'ai-usage', days, 'all'],
    queryFn: () => fetchMeAiUsage({ days }),
  })

  const filteredUsageQuery = useQuery({
    queryKey: ['me', 'ai-usage', days, shopFilter],
    queryFn: () =>
      fetchMeAiUsage({
        days,
        shopId: shopFilter === ALL_SHOPS ? undefined : shopFilter,
      }),
    enabled: shopFilter !== ALL_SHOPS,
  })

  const activeReport =
    shopFilter === ALL_SHOPS ? allUsageQuery.data : filteredUsageQuery.data

  const loading =
    shopFilter === ALL_SHOPS
      ? allUsageQuery.isPending
      : filteredUsageQuery.isPending || allUsageQuery.isPending

  const error =
    shopFilter === ALL_SHOPS
      ? allUsageQuery.error
      : (filteredUsageQuery.error ?? allUsageQuery.error)

  const timeRangeOptions = useMemo(
    () => [
      { value: 'last-7', label: 'Last 7 Days' },
      { value: 'last-30', label: 'Last 30 Days' },
      { value: 'last-90', label: 'Last 90 Days' },
    ],
    []
  )

  const shopOptions = useMemo(() => {
    const shops = allUsageQuery.data?.byShop ?? []
    const opts = [
      { value: ALL_SHOPS, label: 'All workspaces' },
      ...shops.map((s) => ({
        value: s.shopId,
        label: shortShopId(s.shopId),
      })),
    ]
    return opts
  }, [allUsageQuery.data?.byShop])

  useEffect(() => {
    const shops = allUsageQuery.data?.byShop ?? []
    if (shopFilter === ALL_SHOPS) return
    if (!shops.some((s) => s.shopId === shopFilter)) {
      setShopFilter(ALL_SHOPS)
    }
  }, [allUsageQuery.data?.byShop, shopFilter])

  const points = useMemo(() => {
    if (!activeReport?.daily) return []
    return buildChartPoints(days, activeReport.daily)
  }, [activeReport?.daily, days])

  const tableRows = useMemo<ShopTableRow[]>(() => {
    const rows: ApiMeAiUsageByShop[] = activeReport?.byShop ?? []
    return rows.map((s) => ({
      id: s.shopId,
      shopLabel: shortShopId(s.shopId),
      requests: s.requests,
      intelebits: tokensToIntelebits(s.tokens),
    }))
  }, [activeReport?.byShop])

  const columns = useMemo<ColumnDef<ShopTableRow>[]>(
    () => [
      { header: 'Workspace (shop)', accessorKey: 'shopLabel' },
      {
        header: 'Requests',
        accessorKey: 'requests',
        cell: ({ row }) => formatInt(row.original.requests),
      },
      {
        header: 'Intelebits',
        accessorKey: 'intelebits',
        cell: ({ row }) => formatIntelebits(row.original.intelebits),
      },
    ],
    []
  )

  const totals = activeReport?.totals
  const monthlyBudget = activeReport?.monthlyBudget
  const usageTone = usageToneFromPercent(monthlyBudget?.usagePercent ?? 0)

  const intelebitsHelper =
    monthlyBudget != null
      ? `Monthly cap: ${formatIntelebits(monthlyBudget.usedIntelebits)} / ${formatIntelebits(monthlyBudget.capIntelebits)} Intelebits (${monthlyBudget.usagePercent.toFixed(1)}%).`
      : 'Total Intelebits in the selected range (100 tokens = 1 Intelebit). Monthly cap is disabled in this environment.'

  return (
    <Stack gap="200" fullWidth>
      <Inline align="center" gap="100" wrap={false} fullWidth>
        <Dropdown
          options={timeRangeOptions}
          value={timeRange}
          size="small"
          onChange={(v) => setTimeRange(v as TimeRangeValue)}
        />
        <Dropdown
          options={shopOptions}
          value={shopFilter}
          size="small"
          onChange={(v) => setShopFilter(v)}
        />
      </Inline>

      {error ? (
        <Text variant="body3" className="text-red-600">
          {error instanceof Error ? error.message : 'Failed to load usage.'}
        </Text>
      ) : null}

      {loading ? (
        <Inline gap="150" wrap fullWidth>
          <Text variant="body3" color="color.text.subtle">
            Loading usage…
          </Text>
        </Inline>
      ) : (
        <Inline gap="150" wrap fullWidth>
          <MetricTile
            label="Intelebits (range)"
            helper={intelebitsHelper}
            value={formatIntelebits(totals?.intelebits ?? 0)}
            tone={usageTone}
          />
          <MetricTile
            label="Requests"
            helper="AI calls in selected range"
            value={formatInt(totals?.requests ?? 0)}
            tone={usageTone}
          />
        </Inline>
      )}

      <IntelebitsUsageChart points={points} tone={usageTone} />

      <Stack gap="100">
        <Text variant="heading5">Usage by workspace</Text>
        <Table<ShopTableRow>
          data={loading ? [] : tableRows}
          columns={columns}
          size="medium"
          emptyMessage={
            loading
              ? 'Loading usage…'
              : 'No usage in this range. Use the AI assistant to generate data.'
          }
        />
      </Stack>
    </Stack>
  )
}
