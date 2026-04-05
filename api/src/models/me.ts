import type { Team, Notification } from './types.js'
import * as dbTeams from '../db/teams.js'
import * as dbMembers from '../db/members.js'
import * as dbNotifications from '../db/notifications.js'
import * as dbAiTokenUsage from '../db/aiTokenUsage.js'
import {
  getShopMonthlyBudget,
  getWorstMonthlyBudgetAmongUserShops,
  tokensToIntelebits,
  type MonthlyBudgetSnapshot,
} from './aiUsage.js'

export async function getNavTeams(): Promise<Team[]> {
  return dbTeams.getTeams()
}

export type MemberForApi = {
  id: string
  name: string
  username: string
  avatarSrc?: string
  status: string
  joined: string
  provisioned: boolean
  uid: string | null
  teams: string
}

export async function getMemberForApi(
  userId: string
): Promise<MemberForApi | null> {
  const member = await dbMembers.getMemberByUid(userId)
  if (!member) return null
  const teams = await dbTeams.getTeams()
  const teamsById = new Map(teams.map((t) => [t.id, t.name]))
  const teamNames = member.teamIds
    .map((tid) => teamsById.get(tid))
    .filter(Boolean) as string[]
  return {
    id: member.id,
    name: member.name,
    username: member.username,
    avatarSrc: member.avatarSrc,
    status: member.status,
    joined: member.joined,
    provisioned: member.provisioned ?? false,
    uid: member.uid ?? member.userAuthId ?? null,
    teams: teamNames.length ? teamNames.join(', ') : '—',
  }
}

export async function getNotifications(
  userId: string,
  first = 50
): Promise<Notification[]> {
  return dbNotifications.getNotifications(userId, first)
}

export type MeAiUsageDailyApi = { date: string; tokens: number }

export type MeAiUsageByShopApi = {
  shopId: string
  requests: number
  tokens: number
}

export type MeAiUsageReportApi = {
  days: number
  daily: MeAiUsageDailyApi[]
  totals: { requests: number; tokens: number; intelebits: number }
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
