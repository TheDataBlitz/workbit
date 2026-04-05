import * as dbAiUsage from '../db/aiTokenUsage.js'

/** Provider-reported tokens map to Intelebits as 100 tokens = 1 Intelebit. */
export const TOKENS_PER_INTELEBIT = 100

/** Default monthly AI budget per shop (workspace), in Intelebits. */
export const DEFAULT_MAX_INTELEBITS_PER_SHOP_PER_MONTH = 10_000

export function tokensToIntelebits(tokens: number): number {
  return tokens / TOKENS_PER_INTELEBIT
}

/** First instant of the current calendar month in UTC. */
export function startOfUtcMonth(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  )
}

/**
 * Max Intelebits per shop per UTC calendar month.
 * Env `AI_MAX_INTELEBITS_PER_SHOP_PER_MONTH`: positive number, or `0` to disable.
 * When unset, uses {@link DEFAULT_MAX_INTELEBITS_PER_SHOP_PER_MONTH}.
 */
function maxIntelebitsPerShopPerMonth(): number | null {
  const raw = process.env.AI_MAX_INTELEBITS_PER_SHOP_PER_MONTH
  if (raw === undefined || raw === '') {
    return DEFAULT_MAX_INTELEBITS_PER_SHOP_PER_MONTH
  }
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_MAX_INTELEBITS_PER_SHOP_PER_MONTH
  }
  if (n === 0) return null
  return Math.floor(n)
}

/**
 * Throws 429 if the shop has already used its monthly Intelebit allowance (UTC month).
 * Compares summed provider tokens to the cap; does not reserve tokens for the in-flight request.
 */
export async function assertShopMonthlyIntelebitCap(
  shopId: string
): Promise<void> {
  const maxIb = maxIntelebitsPerShopPerMonth()
  if (maxIb == null) return
  const capTokens = maxIb * TOKENS_PER_INTELEBIT
  const since = startOfUtcMonth()
  const used = await dbAiUsage.sumTokensForShopSince(shopId, since)
  if (used >= capTokens) {
    const err = new Error(
      `Usage exceeded: this workspace has reached its monthly limit of ${maxIb.toLocaleString('en-US')} Intelebits. The limit resets at 00:00 UTC on the first day of each month.`
    )
    ;(err as Error & { statusCode?: number }).statusCode = 429
    throw err
  }
}

function maxTokensPerShopPer24h(): number | null {
  const raw = process.env.AI_MAX_TOKENS_PER_SHOP_PER_24H
  if (raw === undefined || raw === '') return null
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.floor(n)
}

/**
 * Throws if the shop is already at or over the rolling-24h token budget (env only).
 * Does not reserve tokens for the in-flight request.
 */
export async function assertShopTokenBudget(shopId: string): Promise<void> {
  const limit = maxTokensPerShopPer24h()
  if (limit == null) return
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const used = await dbAiUsage.sumTokensForShopSince(shopId, since)
  if (used >= limit) {
    const err = new Error(
      `AI token budget exceeded for this shop (rolling 24h, limit ${limit}).`
    )
    ;(err as Error & { statusCode?: number }).statusCode = 429
    throw err
  }
}

export async function recordAiTokenUsage(input: {
  shopId: string
  userId: string
  tokens: number
}): Promise<void> {
  const tokens = Math.max(0, Math.floor(input.tokens))
  await dbAiUsage.insertAiTokenUsage({
    shopId: input.shopId,
    userId: input.userId,
    tokens,
  })
}

/** Workspace month-to-date vs monthly Intelebit cap (for responses / UI). */
export type MonthlyBudgetSnapshot = {
  capIntelebits: number
  usedIntelebits: number
  /** 0–100+ (% of cap consumed this UTC month, workspace-wide). */
  usagePercent: number
}

function roundUsagePercent(usedTokens: number, capTokens: number): number {
  if (capTokens <= 0) return 0
  return Math.round(((usedTokens / capTokens) * 100 + Number.EPSILON) * 10) / 10
}

/** Month-to-date usage for one workspace vs the configured monthly cap. */
export async function getShopMonthlyBudget(
  shopId: string
): Promise<MonthlyBudgetSnapshot | null> {
  const maxIb = maxIntelebitsPerShopPerMonth()
  if (maxIb == null) return null
  const capTokens = maxIb * TOKENS_PER_INTELEBIT
  const used = await dbAiUsage.sumTokensForShopSince(shopId, startOfUtcMonth())
  return {
    capIntelebits: maxIb,
    usedIntelebits: tokensToIntelebits(used),
    usagePercent: roundUsagePercent(used, capTokens),
  }
}

/**
 * Among workspaces the user has used this UTC month, the snapshot with the
 * highest % of workspace cap (workspace totals, not user-only).
 */
export async function getWorstMonthlyBudgetAmongUserShops(
  userId: string
): Promise<MonthlyBudgetSnapshot | null> {
  const maxIb = maxIntelebitsPerShopPerMonth()
  if (maxIb == null) return null
  const monthStart = startOfUtcMonth()
  const shopIds = await dbAiUsage.listDistinctShopIdsForUserSince(
    userId,
    monthStart
  )
  const capTokens = maxIb * TOKENS_PER_INTELEBIT
  if (shopIds.length === 0) {
    return {
      capIntelebits: maxIb,
      usedIntelebits: 0,
      usagePercent: 0,
    }
  }
  let bestPct = -1
  let bestUsed = 0
  for (const sid of shopIds) {
    const used = await dbAiUsage.sumTokensForShopSince(sid, monthStart)
    const pct = capTokens > 0 ? (used / capTokens) * 100 : 0
    if (pct > bestPct) {
      bestPct = pct
      bestUsed = used
    }
  }
  return {
    capIntelebits: maxIb,
    usedIntelebits: tokensToIntelebits(bestUsed),
    usagePercent: roundUsagePercent(bestUsed, capTokens),
  }
}
