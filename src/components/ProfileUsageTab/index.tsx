import { useMemo, useState } from 'react'
import { Avatar } from '@thedatablitz/avatar'
import { Box } from '@thedatablitz/box'
import { BarGraph, KpiCard, type BarGraphDatum } from '@thedatablitz/chart'
import { Dropdown } from '@thedatablitz/dropdown'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Table, type ColumnDef } from '@thedatablitz/table'
import { Text } from '@thedatablitz/text'
import { Skeleton } from '@design-system'

type TimeRangeValue = 'last-7' | 'last-30' | 'last-90'
type ProjectFilterValue = 'all' | 'workbit' | 'core-api'

type UsageUserRow = {
  id: string
  name: string
  role: string
  requests: number
  tokensUsed: number
}

type UsagePoint = {
  dateLabel: string
  value: number
}

function formatInt(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function TokenUsageChart({ points }: { points: UsagePoint[] }) {
  const data = useMemo<BarGraphDatum[]>(
    () => points.map((p) => ({ label: p.dateLabel, value: p.value })),
    [points]
  )

  return (
    <Stack gap="100">
      <Text variant="heading5">Total Token Usage</Text>
      <Box
        fullWidth
        className="rounded-[10px] border border-slate-200 bg-white px-4 pb-3 pt-4"
      >
        <BarGraph data={data} height={200} barColor="#0f172a" />
      </Box>
    </Stack>
  )
}

export function ProfileUsageTab() {
  const [timeRange, setTimeRange] = useState<TimeRangeValue>('last-30')
  const [projectFilter, setProjectFilter] = useState<ProjectFilterValue>('all')
  const [loading] = useState(false)

  const timeRangeOptions = useMemo(
    () => [
      { value: 'last-7', label: 'Last 7 Days' },
      { value: 'last-30', label: 'Last 30 Days' },
      { value: 'last-90', label: 'Last 90 Days' },
    ],
    []
  )

  const projectOptions = useMemo(
    () => [
      { value: 'all', label: 'All Projects' },
      { value: 'workbit', label: 'Workbit' },
      { value: 'core-api', label: 'Core API' },
    ],
    []
  )

  const kpis = useMemo(() => {
    return {
      volume: { current: 2_450_230, limit: 5_000_000 },
      activity: { current: 14_302, limit: 18_000 },
      cost: { current: 245.8, limit: 500 },
    }
  }, [])

  const points = useMemo<UsagePoint[]>(() => {
    const base: UsagePoint[] = [
      { dateLabel: 'Dec 01', value: 28_900 },
      { dateLabel: 'Dec 02', value: 31_250 },
      { dateLabel: 'Dec 03', value: 34_100 },
      { dateLabel: 'Dec 04', value: 27_400 },
      { dateLabel: 'Dec 05', value: 38_600 },
      { dateLabel: 'Dec 06', value: 25_900 },
      { dateLabel: 'Dec 07', value: 35_700 },
      { dateLabel: 'Dec 08', value: 29_200 },
      { dateLabel: 'Dec 09', value: 33_950 },
      { dateLabel: 'Dec 10', value: 26_700 },
      { dateLabel: 'Dec 11', value: 39_850 },
    ]

    if (timeRange === 'last-7') return base.slice(-7)
    if (timeRange === 'last-90') {
      return [
        ...base,
        { dateLabel: 'Dec 12', value: 22_100 },
        { dateLabel: 'Dec 13', value: 24_300 },
        { dateLabel: 'Dec 14', value: 21_900 },
        { dateLabel: 'Dec 15', value: 29_700 },
      ]
    }
    return base
  }, [timeRange])

  const users = useMemo<UsageUserRow[]>(() => {
    if (projectFilter === 'core-api') {
      return [
        {
          id: 'u-1',
          name: 'Arlene McCoy',
          role: 'Engineering',
          requests: 14,
          tokensUsed: 12_004,
        },
      ]
    }
    return [
      {
        id: 'u-1',
        name: 'Arlene McCoy',
        role: 'Engineering',
        requests: 14,
        tokensUsed: 12_004,
      },
      {
        id: 'u-2',
        name: 'Bessie Cooper',
        role: 'Engineering',
        requests: 8,
        tokensUsed: 18_502,
      },
    ]
  }, [projectFilter])

  const columns = useMemo<ColumnDef<UsageUserRow>[]>(
    () => [
      {
        header: 'User',
        accessorKey: 'name',
        cell: ({ row }) => (
          <Inline align="center" gap="100">
            <Avatar name={row.original.name} size="small" />
            <Text variant="body3">{row.original.name}</Text>
          </Inline>
        ),
      },
      { header: 'Role', accessorKey: 'role' },
      {
        header: 'Requests',
        accessorKey: 'requests',
        cell: ({ row }) => formatInt(row.original.requests),
      },
      {
        header: 'Tokens Use',
        accessorKey: 'tokensUsed',
        cell: ({ row }) => formatInt(row.original.tokensUsed),
      },
    ],
    []
  )

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
          options={projectOptions}
          value={projectFilter}
          size="small"
          onChange={(v) => setProjectFilter(v as ProjectFilterValue)}
        />
      </Inline>

      {loading ? (
        <Inline gap="150" wrap fullWidth>
          <Skeleton height="108px" />
          <Skeleton height="108px" />
          <Skeleton height="108px" />
        </Inline>
      ) : (
        <Inline gap="150" wrap={false} fullWidth>
          <KpiCard
            label="Volume"
            helper="Total Tokens Generated"
            value={`${formatInt(kpis.volume.current)} of ${formatInt(
              kpis.volume.limit
            )}`}
            ratio={kpis.volume.current / kpis.volume.limit}
            meterColor="#22c55e"
          />
          <KpiCard
            label="Activity"
            helper="Total Interactions"
            value={`${formatInt(kpis.activity.current)} of ${formatInt(
              kpis.activity.limit
            )}`}
            ratio={kpis.activity.current / kpis.activity.limit}
            meterColor="#f59e0b"
          />
          <KpiCard
            label="Cost"
            helper="Estimated Cost"
            value={`${formatCurrency(kpis.cost.current)}`}
            ratio={kpis.cost.current / kpis.cost.limit}
            meterColor="#10b981"
          />
        </Inline>
      )}

      <TokenUsageChart points={points} />

      <Stack gap="100">
        <Text variant="heading5">User Usage</Text>
        <Table<UsageUserRow>
          data={loading ? [] : users}
          columns={columns}
          size="medium"
          emptyMessage={loading ? 'Loading usage…' : 'No usage found'}
        />
      </Stack>
    </Stack>
  )
}
