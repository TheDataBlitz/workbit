import * as dbAiTooling from '../db/aiToolingTelemetry.js'

export type MeAiToolingRoundsReportApi = {
  days: number
  rows: dbAiTooling.AiToolingRoundRow[]
}

export async function getAiToolingRoundsReportForUser(input: {
  userId: string
  days: number
  shopId: string | null
}): Promise<MeAiToolingRoundsReportApi> {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - input.days)
  since.setUTCHours(0, 0, 0, 0)
  const rows = await dbAiTooling.listAiToolingRoundsForUser({
    userId: input.userId,
    since,
    shopId: input.shopId,
  })
  return { days: input.days, rows }
}
