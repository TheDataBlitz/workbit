import { getClient } from './client.js'

const USAGE_REPORT_PAGE_SIZE = 1000

export type AiTokenUsageInsert = {
  shopId: string
  userId: string
  projectId?: string | null
  tokens: number
  promptTokens?: number
  completionTokens?: number
  consumedAt?: Date
}

export async function insertAiTokenUsage(
  row: AiTokenUsageInsert
): Promise<void> {
  const payload = {
    shop_id: row.shopId,
    user_id: row.userId,
    ...(row.projectId != null && row.projectId !== ''
      ? { project_id: row.projectId }
      : {}),
    tokens: row.tokens,
    ...(typeof row.promptTokens === 'number' &&
    Number.isFinite(row.promptTokens)
      ? { prompt_tokens: Math.max(0, Math.floor(row.promptTokens)) }
      : {}),
    ...(typeof row.completionTokens === 'number' &&
    Number.isFinite(row.completionTokens)
      ? { completion_tokens: Math.max(0, Math.floor(row.completionTokens)) }
      : {}),
    ...(row.consumedAt != null
      ? { consumed_at: row.consumedAt.toISOString() }
      : {}),
  }
  const { error } = await getClient()
    .from('ai_token_usage')
    .insert(payload as never)
  if (error) throw error
}

/** Sum of reported tokens for a shop since `since` (inclusive), for budget checks. */
export async function sumTokensForShopSince(
  shopId: string,
  since: Date
): Promise<number> {
  const { data, error } = await getClient().rpc(
    'sum_ai_token_usage_for_shop_since',
    { p_shop_id: shopId, p_since: since.toISOString() }
  )
  if (error) throw error
  const n = data as unknown
  if (typeof n === 'number' && Number.isFinite(n)) return Number(n)
  if (typeof n === 'string' && n !== '') return Number(n)
  return 0
}

/** Distinct `shop_id` values for a user with usage on or after `since`. */
export async function listDistinctShopIdsForUserSince(
  userId: string,
  since: Date
): Promise<string[]> {
  const sinceIso = since.toISOString()
  const seen = new Set<string>()
  let offset = 0
  for (;;) {
    const { data, error } = await getClient()
      .from('ai_token_usage')
      .select('shop_id')
      .eq('user_id', userId)
      .gte('consumed_at', sinceIso)
      .range(offset, offset + USAGE_REPORT_PAGE_SIZE - 1)
    if (error) throw error
    const batch = (data ?? []) as { shop_id: string }[]
    for (const row of batch) {
      if (row.shop_id) seen.add(row.shop_id)
    }
    if (batch.length < USAGE_REPORT_PAGE_SIZE) break
    offset += USAGE_REPORT_PAGE_SIZE
  }
  return [...seen]
}

type UsageRow = {
  shop_id: string
  tokens: number
  prompt_tokens?: number | null
  completion_tokens?: number | null
  consumed_at: string
}

export type AiTokenUsageDailyRow = {
  date: string
  tokens: number
  promptTokens: number
  completionTokens: number
}

export type AiTokenUsageByShopRow = {
  shopId: string
  requests: number
  tokens: number
  promptTokens: number
  completionTokens: number
}

export type AiTokenUsageReportJson = {
  daily: AiTokenUsageDailyRow[]
  totals: {
    requests: number
    tokens: number
    promptTokens: number
    completionTokens: number
  }
  byShop: AiTokenUsageByShopRow[]
}

export type AiTokenUsageReportForProjectJson = {
  daily: AiTokenUsageDailyRow[]
  totals: {
    requests: number
    tokens: number
    promptTokens: number
    completionTokens: number
  }
}

function utcDateKeyFromConsumedAt(consumedAt: string): string {
  const s = consumedAt.trim()
  if (s.length >= 10 && s[4] === '-' && s[7] === '-') {
    return s.slice(0, 10)
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function aggregateUsageRows(rows: UsageRow[]): AiTokenUsageReportJson {
  const dailyMap = new Map<
    string,
    { tokens: number; promptTokens: number; completionTokens: number }
  >()
  const shopMap = new Map<
    string,
    {
      requests: number
      tokens: number
      promptTokens: number
      completionTokens: number
    }
  >()
  let totalTokens = 0
  let totalPromptTokens = 0
  let totalCompletionTokens = 0

  for (const r of rows) {
    const tokens = Math.max(0, Math.floor(Number(r.tokens) || 0))
    const promptTokens = Math.max(0, Math.floor(Number(r.prompt_tokens) || 0))
    const completionTokens = Math.max(
      0,
      Math.floor(Number(r.completion_tokens) || 0)
    )
    totalTokens += tokens
    totalPromptTokens += promptTokens
    totalCompletionTokens += completionTokens
    const day = utcDateKeyFromConsumedAt(r.consumed_at)
    const prevDay = dailyMap.get(day) ?? {
      tokens: 0,
      promptTokens: 0,
      completionTokens: 0,
    }
    dailyMap.set(day, {
      tokens: prevDay.tokens + tokens,
      promptTokens: prevDay.promptTokens + promptTokens,
      completionTokens: prevDay.completionTokens + completionTokens,
    })

    const prev = shopMap.get(r.shop_id) ?? {
      requests: 0,
      tokens: 0,
      promptTokens: 0,
      completionTokens: 0,
    }
    shopMap.set(r.shop_id, {
      requests: prev.requests + 1,
      tokens: prev.tokens + tokens,
      promptTokens: prev.promptTokens + promptTokens,
      completionTokens: prev.completionTokens + completionTokens,
    })
  }

  const daily = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      tokens: v.tokens,
      promptTokens: v.promptTokens,
      completionTokens: v.completionTokens,
    }))

  const byShop = [...shopMap.entries()]
    .map(([shopId, v]) => ({
      shopId,
      requests: v.requests,
      tokens: v.tokens,
      promptTokens: v.promptTokens,
      completionTokens: v.completionTokens,
    }))
    .sort((a, b) => b.tokens - a.tokens)

  return {
    daily,
    totals: {
      requests: rows.length,
      tokens: totalTokens,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    },
    byShop,
  }
}

/**
 * Usage report for the profile UI: reads `ai_token_usage` via PostgREST and aggregates in Node.
 */
export async function getAiTokenUsageReportForUser(input: {
  userId: string
  since: Date
  shopId: string | null
}): Promise<AiTokenUsageReportJson> {
  const sinceIso = input.since.toISOString()
  const rows: UsageRow[] = []
  let offset = 0

  for (;;) {
    let q = getClient()
      .from('ai_token_usage')
      .select('shop_id, tokens, prompt_tokens, completion_tokens, consumed_at')
      .eq('user_id', input.userId)
      .gte('consumed_at', sinceIso)
      .order('consumed_at', { ascending: true })
      .range(offset, offset + USAGE_REPORT_PAGE_SIZE - 1)

    if (input.shopId != null && input.shopId !== '') {
      q = q.eq('shop_id', input.shopId)
    }

    const { data, error } = await q
    if (error) throw error

    const batch = (data ?? []) as UsageRow[]
    rows.push(...batch)
    if (batch.length < USAGE_REPORT_PAGE_SIZE) break
    offset += USAGE_REPORT_PAGE_SIZE
  }

  return aggregateUsageRows(rows)
}

export async function getAiTokenUsageReportForProject(input: {
  projectId: string
  since: Date
}): Promise<AiTokenUsageReportForProjectJson> {
  const projectId = input.projectId.trim()
  const sinceIso = input.since.toISOString()
  const rows: UsageRow[] = []
  let offset = 0

  for (;;) {
    const { data, error } = await getClient()
      .from('ai_token_usage')
      .select('shop_id, tokens, prompt_tokens, completion_tokens, consumed_at')
      .eq('project_id', projectId)
      .gte('consumed_at', sinceIso)
      .order('consumed_at', { ascending: true })
      .range(offset, offset + USAGE_REPORT_PAGE_SIZE - 1)

    if (error) throw error

    const batch = (data ?? []) as UsageRow[]
    rows.push(...batch)
    if (batch.length < USAGE_REPORT_PAGE_SIZE) break
    offset += USAGE_REPORT_PAGE_SIZE
  }

  const agg = aggregateUsageRows(rows)
  return { daily: agg.daily, totals: agg.totals }
}
