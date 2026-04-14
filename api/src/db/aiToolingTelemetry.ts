import { getClient } from './client.js'

export type AiToolingRequestInsert = {
  shopId: string
  userId: string | null
  projectId: string | null
  provider: string
  model: string | null
  agentKey: string | null
  routerFallback: boolean
  selectionMode: 'none' | 'selected' | 'bucketed' | 'fallback_all'
  selectionTokens: number
  toolsTotalCount: number
  toolsSelectedCount: number
  toolsPayloadBytes: number
  toolRounds: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
  createdAt?: Date
}

export async function insertAiToolingRequest(
  row: AiToolingRequestInsert
): Promise<{ id: string }> {
  const payload = {
    shop_id: row.shopId,
    user_id: row.userId,
    project_id: row.projectId,
    provider: row.provider,
    model: row.model,
    agent_key: row.agentKey,
    router_fallback: row.routerFallback,
    selection_mode: row.selectionMode,
    selection_tokens: Math.max(0, Math.floor(row.selectionTokens)),
    tools_total_count: Math.max(0, Math.floor(row.toolsTotalCount)),
    tools_selected_count: Math.max(0, Math.floor(row.toolsSelectedCount)),
    tools_payload_bytes: Math.max(0, Math.floor(row.toolsPayloadBytes)),
    tool_rounds: Math.max(0, Math.floor(row.toolRounds)),
    total_tokens: Math.max(0, Math.floor(row.totalTokens)),
    prompt_tokens: Math.max(0, Math.floor(row.promptTokens)),
    completion_tokens: Math.max(0, Math.floor(row.completionTokens)),
    ...(row.createdAt != null
      ? { created_at: row.createdAt.toISOString() }
      : {}),
  }

  const { data, error } = await getClient()
    .from('ai_tooling_requests')
    .insert(payload as never)
    .select('id')
    .single()
  if (error) throw error
  const id = (data as { id?: unknown } | null)?.id
  if (typeof id !== 'string' || !id)
    throw new Error('Failed to insert telemetry')
  return { id }
}

export type AiToolingRoundInsert = {
  requestId: string
  roundIndex: number
  toolsSelectedCount: number
  toolsPayloadBytes: number
  toolCallsCount: number
  totalTokens: number
  promptTokens: number
  completionTokens: number
  createdAt?: Date
}

export async function insertAiToolingRound(
  row: AiToolingRoundInsert
): Promise<void> {
  const payload = {
    request_id: row.requestId,
    round_index: Math.max(0, Math.floor(row.roundIndex)),
    tools_selected_count: Math.max(0, Math.floor(row.toolsSelectedCount)),
    tools_payload_bytes: Math.max(0, Math.floor(row.toolsPayloadBytes)),
    tool_calls_count: Math.max(0, Math.floor(row.toolCallsCount)),
    total_tokens: Math.max(0, Math.floor(row.totalTokens)),
    prompt_tokens: Math.max(0, Math.floor(row.promptTokens)),
    completion_tokens: Math.max(0, Math.floor(row.completionTokens)),
    ...(row.createdAt != null
      ? { created_at: row.createdAt.toISOString() }
      : {}),
  }

  const { error } = await getClient()
    .from('ai_tooling_rounds')
    .insert(payload as never)
  if (error) throw error
}

export type AiToolingRoundRow = {
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

export type AiToolingRoundsReport = {
  days: number
  rows: AiToolingRoundRow[]
}

const PAGE_SIZE = 2000

export async function listAiToolingRoundsForUser(input: {
  userId: string
  since: Date
  shopId: string | null
}): Promise<AiToolingRoundRow[]> {
  const sinceIso = input.since.toISOString()
  const rows: AiToolingRoundRow[] = []
  let offset = 0
  for (;;) {
    // Note: `ai_tooling_rounds` does not have user_id, so join to requests.
    let q = getClient()
      .from('ai_tooling_rounds')
      .select(
        'id, request_id, round_index, tools_selected_count, tools_payload_bytes, tool_calls_count, total_tokens, prompt_tokens, completion_tokens, created_at, ai_tooling_requests!inner(shop_id, user_id, created_at)',
        { count: 'exact' }
      )
      .gte('created_at', sinceIso)
      .eq('ai_tooling_requests.user_id', input.userId)
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (input.shopId != null && input.shopId !== '') {
      q = q.eq('ai_tooling_requests.shop_id', input.shopId)
    }

    const { data, error } = await q
    if (error) throw error

    const batch = (data ?? []) as Array<{
      id: string
      request_id: string
      round_index: number
      tools_selected_count: number
      tools_payload_bytes: number
      tool_calls_count: number
      total_tokens: number
      prompt_tokens: number
      completion_tokens: number
      created_at: string
      ai_tooling_requests?: { created_at?: string } | null
    }>

    for (const r of batch) {
      const reqCreatedAt =
        r.ai_tooling_requests &&
        typeof r.ai_tooling_requests === 'object' &&
        typeof (r.ai_tooling_requests as { created_at?: unknown })
          .created_at === 'string'
          ? String((r.ai_tooling_requests as { created_at: string }).created_at)
          : r.created_at
      rows.push({
        id: r.id,
        requestId: r.request_id,
        requestCreatedAt: reqCreatedAt,
        roundIndex: Number(r.round_index) || 0,
        toolsSelectedCount: Number(r.tools_selected_count) || 0,
        toolsPayloadBytes: Number(r.tools_payload_bytes) || 0,
        toolCallsCount: Number(r.tool_calls_count) || 0,
        totalTokens: Number(r.total_tokens) || 0,
        promptTokens: Number(r.prompt_tokens) || 0,
        completionTokens: Number(r.completion_tokens) || 0,
        createdAt: r.created_at,
      })
    }

    if (batch.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return rows
}
