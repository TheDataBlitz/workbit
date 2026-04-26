import type { Request, Response } from 'express'
import { routeToAgentKey } from '../ai/agentRouter.js'
import { AiNotConfiguredError, aiProviderInfo } from '../ai/chat-client.js'
import {
  completePromptWithMcpTools,
  type AiChatTurn,
} from '../ai/mcp/completeWithMcpTools.js'
import { withWorkspaceMcpClient } from '../ai/mcp/workspace-mcp-client.js'
import {
  getAgentCatalogEntry,
  isValidAgentKey,
} from '../models/agentCatalog.js'
import * as projectAgentsModel from '../models/projectAgents.js'
import * as workspaceModel from '../models/workspace.js'
import * as aiUsageModel from '../models/aiUsage.js'
import * as aiToolingTelemetryModel from '../models/aiToolingTelemetry.js'
import { logApiError, logApiWarn } from '../utils/log.js'

/** Cap how many turns we send to NIM to limit tokens (each turn is user or assistant). */
const MAX_CHAT_MESSAGES = 48

const NO_ENABLED_AGENTS_SUFFIX = `## Agent role
No specialized agents are enabled for this project. Answer as the general Workbit assistant using the tools as usual.`

const MCP_ANALYZER_KEY = 'workbit_mcp_analyzer'

const BAD_BODY_MESSAGE =
  'Send { messages: [{ role: "user"|"assistant", content: string }, ...] } with a non-empty final user message, or legacy { prompt: string }. Optional: projectId, selectedAgentKey.'

function redactAiReply(raw: string): string {
  let s = raw
  s = s.replaceAll(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    '[REDACTED_ID]'
  )
  s = s.replaceAll(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/g, 'Bearer [REDACTED]')
  s = s.replaceAll(
    /\b(access[_-]?token|api[_-]?key|secret|service[_-]?role[_-]?key|password)\b\s*[:=]\s*([^\s"'`]+)/gi,
    (_m, k) => `${String(k)}: [REDACTED]`
  )
  return s
}

type ParsedAiRequest = {
  turns: AiChatTurn[]
  projectId?: string
  selectedAgentKey?: string
  /** Tenant key for usage tracking; if omitted, derived from project workspace when projectId is set. */
  shopId?: string
}

function parseMessagesArray(raw: unknown): AiChatTurn[] | null {
  if (!Array.isArray(raw)) return null
  const out: AiChatTurn[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const row = item as Record<string, unknown>
    if (row.role !== 'user' && row.role !== 'assistant') return null
    if (typeof row.content !== 'string' || !row.content.trim()) return null
    out.push({ role: row.role, content: row.content.trim() })
  }
  if (out.length === 0) return null
  if (out[out.length - 1].role !== 'user') return null
  return out.length > MAX_CHAT_MESSAGES ? out.slice(-MAX_CHAT_MESSAGES) : out
}

function parseAiChatBody(body: unknown): ParsedAiRequest | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const projectId =
    typeof b.projectId === 'string' && b.projectId.trim()
      ? b.projectId.trim()
      : undefined
  const selectedAgentKey =
    typeof b.selectedAgentKey === 'string' && b.selectedAgentKey.trim()
      ? b.selectedAgentKey.trim()
      : undefined
  const shopId =
    typeof b.shopId === 'string' && b.shopId.trim()
      ? b.shopId.trim()
      : undefined

  const fromMessages = parseMessagesArray(b.messages)
  if (fromMessages) {
    return { turns: fromMessages, projectId, selectedAgentKey, shopId }
  }

  if (typeof b.prompt === 'string' && b.prompt.trim()) {
    return {
      turns: [{ role: 'user', content: b.prompt.trim() }],
      projectId,
      selectedAgentKey,
      shopId,
    }
  }

  return null
}

type ResolveSuffixResult =
  | {
      ok: true
      systemPromptSuffix?: string
      agentKey?: string
      routerFallback?: boolean
    }
  | { ok: false; status: number; error: string }

function okSuffixFromCatalogKey(
  agentKey: string,
  router?: { fallback: boolean }
): Extract<ResolveSuffixResult, { ok: true }> {
  const entry = getAgentCatalogEntry(agentKey)
  return {
    ok: true,
    systemPromptSuffix: entry?.systemPromptSuffix,
    agentKey,
    ...(router ? { routerFallback: router.fallback } : {}),
  }
}

async function resolveSystemSuffixForProjectAgents(input: {
  projectId: string
  projectName: string
  selectedAgentKey?: string
  lastUserMessage: string
}): Promise<ResolveSuffixResult> {
  const { projectId, projectName, selectedAgentKey, lastUserMessage } = input
  const enabledKeys = await projectAgentsModel.listEnabledAgentKeys(projectId)
  const analyzerEnabled = enabledKeys.includes(MCP_ANALYZER_KEY)

  if (selectedAgentKey) {
    if (!isValidAgentKey(selectedAgentKey)) {
      return { ok: false, status: 400, error: 'Unknown selectedAgentKey' }
    }
    if (!enabledKeys.includes(selectedAgentKey)) {
      return {
        ok: false,
        status: 400,
        error: 'selectedAgentKey is not enabled for this project',
      }
    }
    return okSuffixFromCatalogKey(selectedAgentKey)
  }

  if (enabledKeys.length === 0) {
    return { ok: true, systemPromptSuffix: NO_ENABLED_AGENTS_SUFFIX }
  }

  if (enabledKeys.length === 1) {
    return okSuffixFromCatalogKey(enabledKeys[0])
  }

  const suffixForKey = (k: string): string =>
    getAgentCatalogEntry(k)?.systemPromptSuffix ?? ''

  const routingKeys = analyzerEnabled
    ? enabledKeys.filter((k) => k !== MCP_ANALYZER_KEY)
    : enabledKeys

  if (routingKeys.length === 0) {
    return okSuffixFromCatalogKey(MCP_ANALYZER_KEY)
  }

  const entries = projectAgentsModel.catalogEntriesForKeys(routingKeys)
  const { agentKey, usedFallback } = await routeToAgentKey({
    enabledAgents: entries,
    lastUserMessage,
    projectName,
  })

  if (usedFallback) {
    logApiWarn('ai.agent_router_fallback', {
      context: 'ai.postAi',
      projectId,
      agentKey,
    })
  }

  if (!analyzerEnabled) {
    return okSuffixFromCatalogKey(agentKey, { fallback: usedFallback })
  }

  const combined = [suffixForKey(MCP_ANALYZER_KEY), suffixForKey(agentKey)]
    .map((s) => s.trim())
    .filter(Boolean)
    .join('\n\n')

  return {
    ok: true,
    systemPromptSuffix: combined,
    agentKey,
    routerFallback: usedFallback,
  }
}

type CompletionOptionsResult =
  | {
      ok: true
      options?: { systemPromptSuffix: string }
      agentKey?: string
      routerFallback?: boolean
    }
  | { ok: false; status: number; error: string }

async function completionOptionsForParsedRequest(
  parsed: ParsedAiRequest
): Promise<CompletionOptionsResult> {
  const { projectId, selectedAgentKey, turns } = parsed

  // Start with any agent suffix (project-scoped).
  let systemPromptSuffix: string | undefined
  let agentKey: string | undefined
  let routerFallback: boolean | undefined
  if (projectId) {
    const project = await workspaceModel.getProjectByIdForApi(projectId)
    if (!project) {
      return { ok: false, status: 404, error: 'Project not found' }
    }

    const resolved = await resolveSystemSuffixForProjectAgents({
      projectId,
      projectName: project.name,
      selectedAgentKey,
      lastUserMessage: turns[turns.length - 1].content,
    })

    if (!resolved.ok) {
      return { ok: false, status: resolved.status, error: resolved.error }
    }

    systemPromptSuffix = resolved.systemPromptSuffix
    agentKey = resolved.agentKey
    routerFallback = resolved.routerFallback
  }

  if (!systemPromptSuffix?.trim())
    return { ok: true, options: undefined, agentKey, routerFallback }
  return {
    ok: true,
    options: { systemPromptSuffix: systemPromptSuffix.trim() },
    agentKey,
    routerFallback,
  }
}

function telemetryProviderName(
  provider: ReturnType<typeof aiProviderInfo>['provider']
): 'nvidia_nim' | 'ollama' {
  return provider === 'ollama' ? 'ollama' : 'nvidia_nim'
}

async function resolveShopIdForAi(
  parsed: ParsedAiRequest
): Promise<
  { ok: true; shopId: string } | { ok: false; status: number; error: string }
> {
  if (parsed.shopId?.trim()) {
    return { ok: true, shopId: parsed.shopId.trim() }
  }
  if (parsed.projectId) {
    const wid = await workspaceModel.getWorkspaceIdForProject(parsed.projectId)
    if (!wid) {
      return {
        ok: false,
        status: 400,
        error:
          'Could not resolve shop for this project; send shopId or fix team workspace.',
      }
    }
    return { ok: true, shopId: wid }
  }
  return {
    ok: false,
    status: 400,
    error:
      'shopId or projectId is required (shop tags AI usage; projectId can derive shop from workspace).',
  }
}

/**
 * POST /api/v1/ai — body: `{ messages, projectId?, selectedAgentKey?, shopId? }` or legacy `{ prompt, ... }` → `{ reply, usage }`.
 * Usage is tagged with `shopId` (body) or workspace from `projectId`. Last message must be `user`. Uses Workbit MCP + NIM.
 */
export async function postAi(req: Request, res: Response) {
  const parsed = parseAiChatBody(req.body)
  if (!parsed) {
    res.status(400).json({ error: BAD_BODY_MESSAGE })
    return
  }

  if (parsed.selectedAgentKey && !parsed.projectId) {
    res.status(400).json({
      error: 'projectId is required when selectedAgentKey is set.',
    })
    return
  }

  const auth = req.workbitUpstreamAuth
  if (!auth) {
    logApiError(new Error('postAi: missing workbitUpstreamAuth'), 'ai.postAi')
    res.status(500).json({ error: 'Invalid auth state for AI.' })
    return
  }

  try {
    const shop = await resolveShopIdForAi(parsed)
    if (!shop.ok) {
      res.status(shop.status).json({ error: shop.error })
      return
    }

    const opts = await completionOptionsForParsedRequest(parsed)
    if (!opts.ok) {
      res.status(opts.status).json({ error: opts.error })
      return
    }

    await aiUsageModel.assertShopMonthlyIntelebitCap(shop.shopId)
    await aiUsageModel.assertShopTokenBudget(shop.shopId)

    const { reply, totalTokens, promptTokens, completionTokens, tooling } =
      await withWorkspaceMcpClient({
        auth,
        workspaceId: shop.shopId,
        fn: (c) => completePromptWithMcpTools(c, parsed.turns, opts.options),
      })

    const userId = req.user?.id
    if (userId) {
      try {
        await aiUsageModel.recordAiTokenUsage({
          shopId: shop.shopId,
          userId,
          tokens: totalTokens,
          promptTokens,
          completionTokens,
        })
      } catch (err) {
        logApiWarn('ai.token_usage_persist_failed', {
          context: 'ai.postAi',
          shopId: shop.shopId,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    // Internal telemetry for monitoring (best-effort).
    try {
      const provider = aiProviderInfo()
      const ctx: aiToolingTelemetryModel.AiToolingTelemetryContext = {
        shopId: shop.shopId,
        userId: userId ?? null,
        projectId: parsed.projectId ?? null,
        provider: telemetryProviderName(provider.provider),
        model: provider.model,
        agentKey: opts.agentKey ?? null,
        routerFallback: Boolean(opts.routerFallback),
      }
      const reqRow = await aiToolingTelemetryModel.recordAiToolingRequest({
        ctx,
        selectionMode: tooling.selectionMode,
        selectionTokens: tooling.selectionTokens,
        toolsTotalCount: tooling.toolsTotalCount,
        toolsSelectedCount: tooling.toolsSelectedCount,
        toolsPayloadBytes: tooling.toolsPayloadBytes,
        toolRounds: tooling.toolRounds,
        totalTokens,
        promptTokens,
        completionTokens,
      })
      for (const r of tooling.rounds) {
        await aiToolingTelemetryModel.recordAiToolingRound({
          requestId: reqRow.requestId,
          roundIndex: r.roundIndex,
          toolsSelectedCount: r.toolsSelectedCount,
          toolsPayloadBytes: r.toolsPayloadBytes,
          toolCallsCount: r.toolCallsCount,
          totalTokens: r.totalTokens,
          promptTokens: r.promptTokens,
          completionTokens: r.completionTokens,
        })
      }
    } catch (err) {
      logApiWarn('ai.tooling_telemetry_failed', {
        context: 'ai.postAi',
        shopId: shop.shopId,
        message: err instanceof Error ? err.message : String(err),
      })
    }

    const monthlyBudget = await aiUsageModel.getShopMonthlyBudget(shop.shopId)

    res.json({
      reply: redactAiReply(reply),
      usage: {
        tokens: totalTokens,
        intelebits: aiUsageModel.tokensToIntelebits(totalTokens),
        usagePercent: monthlyBudget?.usagePercent ?? 0,
        monthlyBudget,
      },
    })
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode
    if (status === 429) {
      res.status(429).json({
        error: e instanceof Error ? e.message : 'AI rate limit exceeded.',
      })
      return
    }
    if (e instanceof AiNotConfiguredError) {
      res.status(503).json({ error: e.message })
      return
    }
    logApiError(e, 'ai.postAi')
    res.status(500).json({
      error: e instanceof Error ? e.message : 'AI request failed.',
    })
  }
}
