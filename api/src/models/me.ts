import type { Notification } from './types.js'
import * as dbMembers from '../db/members.js'
import * as dbNotifications from '../db/notifications.js'
import * as dbAiTokenUsage from '../db/aiTokenUsage.js'
import {
  getShopMonthlyBudget,
  getWorstMonthlyBudgetAmongUserShops,
  tokensToIntelebits,
  type MonthlyBudgetSnapshot,
} from './aiUsage.js'

export type MemberForApi = {
  id: string
  name: string
  username: string
  avatarSrc?: string
  status: string
  joined: string
  provisioned: boolean
  uid: string | null
}

export async function getMemberForApi(
  userId: string
): Promise<MemberForApi | null> {
  const member = await dbMembers.getMemberByUid(userId)
  if (!member) return null
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    avatarSrc: member.avatarSrc,
    status: member.status,
    joined: member.joined,
    provisioned: member.provisioned ?? false,
    uid: member.uid ?? member.userAuthId ?? null,
  }
}

export async function getNotifications(
  userId: string,
  first = 50
): Promise<Notification[]> {
  return dbNotifications.getNotifications(userId, first)
}

export type MeAiUsageDailyApi = {
  date: string
  tokens: number
  promptTokens: number
  completionTokens: number
}

export type MeAiUsageByShopApi = {
  shopId: string
  requests: number
  tokens: number
  promptTokens: number
  completionTokens: number
}

export type MeAiUsageReportApi = {
  days: number
  daily: MeAiUsageDailyApi[]
  totals: {
    requests: number
    tokens: number
    promptTokens: number
    completionTokens: number
    intelebits: number
  }
  byShop: MeAiUsageByShopApi[]
  /** Workspace vs monthly Intelebit cap (UTC month); null if cap disabled via env. */
  monthlyBudget: MonthlyBudgetSnapshot | null
}

export async function getAiUsageReportForUser(input: {
  userId: string
  days: number
  shopId: string | null
}): Promise<MeAiUsageReportApi> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - input.days)
  since.setUTCHours(0, 0, 0, 0)
  const report = await dbAiTokenUsage.getAiTokenUsageReportForUser({
    userId: input.userId,
    since,
    shopId: input.shopId,
  })
  const monthlyBudget =
    input.shopId != null && input.shopId !== ''
      ? await getShopMonthlyBudget(input.shopId)
      : await getWorstMonthlyBudgetAmongUserShops(input.userId)
  return {
    days: input.days,
    daily: report.daily,
    totals: {
      ...report.totals,
      intelebits: tokensToIntelebits(report.totals.tokens),
    },
    byShop: report.byShop,
    monthlyBudget,
  }
}
