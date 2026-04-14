import { authFetch } from './client'

export type ApiAiToolingRoundRow = {
  id: string
  requestId: string
  requestCreatedAt: string
  roundIndex: number
  toolsSelectedCount: number
  toolsPayloadBytes: number
  toolCallsCount: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
  createdAt: string
}

export type ApiAiToolingRoundsReport = {
  days: number
  rows: ApiAiToolingRoundRow[]
}

export async function fetchAiToolingRoundsReport(input?: {
  days?: number
  shopId?: string | null
}): Promise<ApiAiToolingRoundsReport> {
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
  return authFetch<ApiAiToolingRoundsReport>(
    `/usage/ai-tooling-rounds${suffix}`
  )
}
