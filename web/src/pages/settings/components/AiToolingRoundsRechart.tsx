import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
} from 'recharts'
import { Text } from '@thedatablitz/text'
import type { ApiAiToolingRoundRow } from '../../../api/usage'

type Point = {
  label: string
  requestId: string
  startedAt: string
  rounds: number
  avgRoundIndex: number
  maxRoundIndex: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
  toolCalls: number
  toolsSelected: number
  toolsPayloadKb: number
}

function shortDateLabel(iso: string): string {
  const d = new Date(iso)
  const ms = d.getTime()
  if (!Number.isFinite(ms)) return iso
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function AiToolingRoundsRechart(props: {
  rows: ApiAiToolingRoundRow[]
  height?: number
  loading?: boolean
}) {
  const rows = props.rows ?? []
  const map = new Map<
    string,
    {
      requestCreatedAt: string
      rounds: number
      roundIndexSum: number
      maxRoundIndex: number
      totalTokens: number
      promptTokens: number
      completionTokens: number
      toolCalls: number
      toolsSelected: number
      toolsPayloadBytes: number
    }
  >()

  for (const r of rows) {
    const key = r.requestId
    const cur = map.get(key) ?? {
      requestCreatedAt: r.requestCreatedAt || r.createdAt,
      rounds: 0,
      roundIndexSum: 0,
      maxRoundIndex: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      toolCalls: 0,
      toolsSelected: 0,
      toolsPayloadBytes: 0,
    }
    cur.rounds += 1
    const ri = Number(r.roundIndex) || 0
    cur.roundIndexSum += ri
    if (ri > cur.maxRoundIndex) cur.maxRoundIndex = ri
    cur.totalTokens += Number(r.totalTokens) || 0
    cur.promptTokens += Number(r.promptTokens) || 0
    cur.completionTokens += Number(r.completionTokens) || 0
    cur.toolCalls += Number(r.toolCallsCount) || 0
    cur.toolsSelected += Number(r.toolsSelectedCount) || 0
    cur.toolsPayloadBytes += Number(r.toolsPayloadBytes) || 0
    map.set(key, cur)
  }

  const data: Point[] = [...map.entries()]
    .sort(([, a], [, b]) =>
      String(a.requestCreatedAt).localeCompare(String(b.requestCreatedAt))
    )
    .slice(-40)
    .map(([requestId, v], i) => ({
      requestId,
      startedAt: v.requestCreatedAt,
      label: `#${i + 1} ${shortDateLabel(v.requestCreatedAt)}`,
      rounds: v.rounds,
      avgRoundIndex: v.rounds > 0 ? v.roundIndexSum / v.rounds : 0,
      maxRoundIndex: v.maxRoundIndex,
      totalTokens: v.totalTokens,
      promptTokens: v.promptTokens,
      completionTokens: v.completionTokens,
      toolCalls: v.toolCalls,
      toolsSelected: v.toolsSelected,
      toolsPayloadKb: v.toolsPayloadBytes / 1024,
    }))

  return (
    <div style={{ width: '100%', height: props.height ?? 360 }}>
      <ResponsiveContainer>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
          <XAxis dataKey="label" tickMargin={8} interval="preserveStartEnd" />

          <YAxis
            yAxisId="tokens"
            tickMargin={8}
            width={56}
            tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`}
          />
          <YAxis
            yAxisId="counts"
            orientation="right"
            tickMargin={8}
            width={56}
            tickFormatter={(v) => String(Math.round(Number(v)))}
          />
          <YAxis
            yAxisId="kb"
            orientation="right"
            tickMargin={8}
            width={56}
            tickFormatter={(v) => `${Math.round(Number(v))}kb`}
            hide
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const p = payload[0]?.payload as Point
              return (
                <div
                  style={{
                    background: 'rgba(0,0,0,0.78)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '10px 12px',
                    borderRadius: 10,
                    maxWidth: 320,
                  }}
                >
                  <Text
                    as="div"
                    variant="caption2"
                    color="color.text.DEFAULT"
                    style={{ margin: 0 }}
                  >
                    {label}
                  </Text>
                  <Text
                    as="div"
                    variant="caption2"
                    color="color.text.subtle"
                    style={{ marginTop: 6 }}
                  >
                    rounds {p.rounds} • avg_round_index{' '}
                    {p.avgRoundIndex.toFixed(2)} • max_round_index{' '}
                    {p.maxRoundIndex}
                  </Text>
                  <Text
                    as="div"
                    variant="caption2"
                    color="color.text.subtle"
                    style={{ marginTop: 6 }}
                  >
                    tokens: total {Math.round(p.totalTokens).toLocaleString()} •
                    prompt {Math.round(p.promptTokens).toLocaleString()} •
                    completion {Math.round(p.completionTokens).toLocaleString()}
                  </Text>
                  <Text
                    as="div"
                    variant="caption2"
                    color="color.text.subtle"
                    style={{ marginTop: 6 }}
                  >
                    tool_calls {Math.round(p.toolCalls).toLocaleString()} •
                    tools_selected{' '}
                    {Math.round(p.toolsSelected).toLocaleString()} • payload{' '}
                    {Math.round(p.toolsPayloadKb).toLocaleString()} kb
                  </Text>
                </div>
              )
            }}
          />
          <Legend />

          {/* Tokens (stacked bars) */}
          <Bar
            yAxisId="tokens"
            dataKey="promptTokens"
            name="Prompt tokens"
            stackId="tokens"
            fill="rgba(120, 140, 255, 0.65)"
            isAnimationActive={!props.loading}
          />
          <Bar
            yAxisId="tokens"
            dataKey="completionTokens"
            name="Completion tokens"
            stackId="tokens"
            fill="rgba(160, 120, 255, 0.55)"
            isAnimationActive={!props.loading}
          />

          {/* Other columns as lines on count axes */}
          <Line
            yAxisId="counts"
            type="monotone"
            dataKey="toolCalls"
            name="Tool calls"
            stroke="rgba(255, 210, 92, 0.9)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!props.loading}
          />
          <Line
            yAxisId="counts"
            type="monotone"
            dataKey="toolsSelected"
            name="Tools selected"
            stroke="rgba(92, 230, 190, 0.9)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!props.loading}
          />
          <Line
            yAxisId="kb"
            type="monotone"
            dataKey="toolsPayloadKb"
            name="Tools payload (kb)"
            stroke="rgba(255, 120, 160, 0.9)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={!props.loading}
          />
          <Line
            yAxisId="counts"
            type="monotone"
            dataKey="rounds"
            name="Rounds"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={!props.loading}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
