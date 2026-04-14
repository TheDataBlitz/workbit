import { authFetch } from './client'

export type ApiMeMember = {
  id: string
  name: string
  username: string
  email?: string
  workspaceId?: string | null
}

export async function fetchMeMember(): Promise<ApiMeMember> {
  return authFetch<ApiMeMember>('/me/member')
}

export type ApiMeAiUsageDaily = { date: string; tokens: number }

export type ApiMeAiUsageByShop = {
  shopId: string
  requests: number
  tokens: number
}

export type ApiMonthlyBudgetSnapshot = {
  capIntelebits: number
  usedIntelebits: number
  usagePercent: number
}

export type ApiMeAiUsageReport = {
  days: number
  daily: ApiMeAiUsageDaily[]
  totals: { requests: number; tokens: number; intelebits: number }
  byShop: ApiMeAiUsageByShop[]
  monthlyBudget: ApiMonthlyBudgetSnapshot | null
}

export async function fetchMeAiUsageReport(input?: {
  days?: number
  shopId?: string | null
}): Promise<ApiMeAiUsageReport> {
  const days = input?.days
  const shopId = input?.shopId ?? null
  const qs = new URLSearchParams()
  if (typeof days === 'number' && Number.isFinite(days)) {
    qs.set('days', String(Math.floor(days)))
  }
  if (shopId && shopId.trim()) {
    qs.set('shopId', shopId.trim())
  }
  const suffix = qs.size > 0 ? `?${qs.toString()}` : ''
  return authFetch<ApiMeAiUsageReport>(`/me/ai-usage${suffix}`)
}
