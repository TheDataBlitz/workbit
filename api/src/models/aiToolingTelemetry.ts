import * as db from '../db/aiToolingTelemetry.js'

export type AiToolingTelemetryContext = {
  shopId: string
  userId: string | null
  projectId: string | null
  provider: string
  model: string | null
  agentKey: string | null
  routerFallback: boolean
}

export async function recordAiToolingRequest(input: {
  ctx: AiToolingTelemetryContext
  selectionMode: db.AiToolingRequestInsert['selectionMode']
  selectionTokens: number
  toolsTotalCount: number
  toolsSelectedCount: number
  toolsPayloadBytes: number
  toolRounds: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
}): Promise<{ requestId: string }> {
  const { id } = await db.insertAiToolingRequest({
    shopId: input.ctx.shopId,
    userId: input.ctx.userId,
    projectId: input.ctx.projectId,
    provider: input.ctx.provider,
    model: input.ctx.model,
    agentKey: input.ctx.agentKey,
    routerFallback: input.ctx.routerFallback,
    selectionMode: input.selectionMode,
    selectionTokens: input.selectionTokens,
    toolsTotalCount: input.toolsTotalCount,
    toolsSelectedCount: input.toolsSelectedCount,
    toolsPayloadBytes: input.toolsPayloadBytes,
    toolRounds: input.toolRounds,
    totalTokens: input.totalTokens,
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
  })
  return { requestId: id }
}

export async function recordAiToolingRound(input: {
  requestId: string
  roundIndex: number
  toolsSelectedCount: number
  toolsPayloadBytes: number
  toolCallsCount: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
}): Promise<void> {
  await db.insertAiToolingRound({
    requestId: input.requestId,
    roundIndex: input.roundIndex,
    toolsSelectedCount: input.toolsSelectedCount,
    toolsPayloadBytes: input.toolsPayloadBytes,
    toolCallsCount: input.toolCallsCount,
    totalTokens: input.totalTokens,
    promptTokens: input.promptTokens,
    completionTokens: input.completionTokens,
  })
}
