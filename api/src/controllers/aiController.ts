import type { Request, Response } from 'express'
import { routeToAgentKey } from '../ai/agentRouter.js'
import {
  AiNotConfiguredError,
  aiProviderInfo,
  runChatCompletion,
  streamChatCompletionText,
} from '../ai/chat-client.js'
import {
  completePromptWithMcpTools,
  type AiChatTurn,
  WORKBIT_AI_SYSTEM_PROMPT,
} from '../ai/mcp/completeWithMcpTools.js'
import { withWorkspaceMcpClient } from '../ai/mcp/workspace-mcp-client.js'
import { withMcpClient } from '../ai/mcp/workbit-mcp-client.js'
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
const MCP_EXECUTOR_KEY = 'workbit_mcp_executor'
const PLANNER_KEY = 'workbit_planner'
const ORCHESTRATOR_KEY = 'workbit_orchestrator'

const BAD_BODY_MESSAGE =
  'Send { messages: [{ role: "user"|"assistant", content: string }, ...] } with a non-empty final user message, or legacy { prompt: string }. Optional: projectId, selectedAgentKey, workspaceId.'

function buildSystemPromptWithSuffix(suffix: string | undefined): string {
  return suffix?.trim()
    ? `${WORKBIT_AI_SYSTEM_PROMPT}\n\n${suffix.trim()}`
    : WORKBIT_AI_SYSTEM_PROMPT
}

function redactAiReply(raw: string): string {
  let s = raw
  s = s.replaceAll(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*\b/g, 'Bearer [REDACTED]')
  s = s.replaceAll(
    /\b(access[_-]?token|api[_-]?key|secret|service[_-]?role[_-]?key|password)\b\s*[:=]\s*([^\s"'`]+)/gi,
    (_m, k) => `${String(k)}: [REDACTED]`
  )
  return s
}

function normalizeAiReply(raw: unknown): { ok: true; reply: string } | { ok: false } {
  if (typeof raw !== 'string') return { ok: false }
  const s = raw.trim()
  if (!s) return { ok: false }
  return { ok: true, reply: s }
}

type ParsedAiRequest = {
  turns: AiChatTurn[]
  projectId?: string
  selectedAgentKey?: string
  /** Tenant key for usage tracking; if omitted, derived from project workspace when projectId is set. */
  workspaceId?: string
  /** Back-compat alias. Prefer workspaceId. */
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
  const workspaceId =
    typeof b.workspaceId === 'string' && b.workspaceId.trim()
      ? b.workspaceId.trim()
      : undefined
  const shopId =
    typeof b.shopId === 'string' && b.shopId.trim() ? b.shopId.trim() : undefined

  const fromMessages = parseMessagesArray(b.messages)
  if (fromMessages) {
    return { turns: fromMessages, projectId, selectedAgentKey, workspaceId, shopId }
  }

  if (typeof b.prompt === 'string' && b.prompt.trim()) {
    return {
      turns: [{ role: 'user', content: b.prompt.trim() }],
      projectId,
      selectedAgentKey,
      workspaceId,
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
  const wid = parsed.workspaceId?.trim() || parsed.shopId?.trim()
  if (wid) {
    return { ok: true, shopId: wid }
  }
  if (parsed.projectId) {
    const wid = await workspaceModel.getWorkspaceIdForProject(parsed.projectId)
    if (!wid) {
      // If a client sends a projectId that isn't resolvable (e.g. route param is a
      // workspace slug / stale id), don't hard-fail: allow the request to run in
      // "no shop" mode unless the client explicitly provided shopId.
      return {
        ok: false,
        status: 400,
        error:
          'Could not resolve workspace for this project; omit projectId or send workspaceId.',
      }
    }
    return { ok: true, shopId: wid }
  }
  return {
    ok: false,
    status: 400,
    error:
      'workspaceId or projectId is required (workspace tags AI usage; projectId can derive workspace from project).',
  }
}

/**
 * POST /api/v1/ai — body: `{ messages, projectId?, selectedAgentKey?, workspaceId? }` or legacy `{ prompt, ... }` → `{ reply, usage }`.
 * Usage is tagged with `workspaceId` (body) or workspace from `projectId`. Last message must be `user`. Uses Workbit MCP + NIM.
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
    const wantsStream =
      req.query?.stream === '1' ||
      (typeof req.headers.accept === 'string' &&
        req.headers.accept.includes('text/event-stream'))

    if (wantsStream) {
      res.status(200)
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders?.()

      const writeEvent = (event: string, data: unknown) => {
        res.write(`event: ${event}\n`)
        res.write(`data: ${JSON.stringify(data)}\n\n`)
      }

      const endStream = () => {
        try {
          res.end()
        } catch {
          /* ignore */
        }
      }

      // Streaming mode is intentionally "raw model stream" (no MCP tools),
      // so we can forward incremental tokens immediately.
      const opts = await completionOptionsForParsedRequest(parsed)
      if (!opts.ok) {
        writeEvent('error', { error: opts.error })
        endStream()
        return
      }

      const system = buildSystemPromptWithSuffix(opts.options?.systemPromptSuffix)
      const messages = [
        { role: 'system', content: system },
        ...parsed.turns.map((t) => ({ role: t.role, content: t.content })),
      ] as const

      let full = ''
      writeEvent('start', { provider: aiProviderInfo() })

      try {
        for await (const ev of streamChatCompletionText({
          messages: messages as any,
        })) {
          if (ev.type === 'delta') {
            full += ev.contentDelta
            writeEvent('delta', { content: ev.contentDelta })
          } else {
            const reply = redactAiReply(full.trim())
            writeEvent('done', {
              reply,
              usage: {
                tokens: ev.usage.totalTokens,
                intelebits: aiUsageModel.tokensToIntelebits(ev.usage.totalTokens),
              },
            })
            endStream()
            return
          }
        }
      } catch (e) {
        writeEvent('error', {
          error: e instanceof Error ? e.message : 'AI streaming failed.',
        })
        endStream()
        return
      }

      // Safety: should not get here.
      endStream()
      return
    }

    // Allow "no workspace yet" chats (e.g. before the user creates/selects a workspace).
    // These are best-effort, do not use MCP tools, and do not enforce shop budgets/caps.
    if (!parsed.workspaceId && !parsed.shopId && !parsed.projectId) {
      const { reply, totalTokens } = await withMcpClient(auth, (client) =>
        completePromptWithMcpTools(client as any, parsed.turns, {
          systemPromptSuffix: undefined,
        })
      )
      const normalized = normalizeAiReply(reply)
      if (!normalized.ok) {
        logApiWarn('ai.empty_reply', {
          context: 'ai.postAi.no_shop',
        })
        res.status(502).json({
          error:
            'AI provider returned an empty response. Please retry in a moment.',
        })
        return
      }
      res.json({
        reply: redactAiReply(normalized.reply),
        usage: {
          tokens: totalTokens,
          intelebits: aiUsageModel.tokensToIntelebits(totalTokens),
          usagePercent: 0,
          monthlyBudget: null,
        },
      })
      return
    }

    const shop = await resolveShopIdForAi(parsed)
    if (!shop.ok) {
      // If we can't resolve the workspace from a provided projectId, fall back
      // to the no-shop tool loop so the assistant can suggest next steps
      // (e.g., create a workspace/project) instead of hard failing.
      if (!parsed.workspaceId?.trim() && !parsed.shopId?.trim()) {
        const { reply, totalTokens } = await withMcpClient(auth, (client) =>
          completePromptWithMcpTools(client as any, parsed.turns, {
            systemPromptSuffix: undefined,
          })
        )
        const normalized = normalizeAiReply(reply)
        if (!normalized.ok) {
          logApiWarn('ai.empty_reply', {
            context: 'ai.postAi.shop_resolve_fallback',
          })
          res.status(502).json({
            error:
              'AI provider returned an empty response. Please retry in a moment.',
          })
          return
        }
        res.json({
          reply: redactAiReply(normalized.reply),
          usage: {
            tokens: totalTokens,
            intelebits: aiUsageModel.tokensToIntelebits(totalTokens),
            usagePercent: 0,
            monthlyBudget: null,
          },
        })
        return
      }
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

    // Orchestrator: call sub-agents (analyzer → planner → executor).
    if (opts.agentKey === ORCHESTRATOR_KEY && parsed.projectId) {
      const enabledKeys = await projectAgentsModel.listEnabledAgentKeys(
        parsed.projectId
      )
      const required = [MCP_ANALYZER_KEY, PLANNER_KEY, MCP_EXECUTOR_KEY]
      const missing = required.filter((k) => !enabledKeys.includes(k))
      if (missing.length > 0) {
        res.json({
          reply: redactAiReply(
            `To proceed, enable these agents for this project: ${missing.join(
              ', '
            )}.`
          ),
          usage: {
            tokens: 0,
            intelebits: 0,
            usagePercent: 0,
            monthlyBudget: await aiUsageModel.getShopMonthlyBudget(shop.shopId),
          },
        })
        return
      }

      const analyzerSuffix =
        getAgentCatalogEntry(MCP_ANALYZER_KEY)?.systemPromptSuffix
      const plannerSuffix = getAgentCatalogEntry(PLANNER_KEY)?.systemPromptSuffix
      const executorSuffix =
        getAgentCatalogEntry(MCP_EXECUTOR_KEY)?.systemPromptSuffix

      const analyzerRes = await runChatCompletion({
        messages: [
          { role: 'system', content: buildSystemPromptWithSuffix(analyzerSuffix) },
          ...parsed.turns.map((t) => ({ role: t.role, content: t.content })),
        ],
        tool_choice: 'none',
      })

      const plannerRes = await runChatCompletion({
        messages: [
          { role: 'system', content: buildSystemPromptWithSuffix(plannerSuffix) },
          ...parsed.turns.map((t) => ({ role: t.role, content: t.content })),
          {
            role: 'assistant',
            content:
              typeof analyzerRes.content === 'string'
                ? analyzerRes.content
                : '',
          },
        ],
        tool_choice: 'none',
      })

      const orchestratedTurns: AiChatTurn[] = [
        ...parsed.turns,
        {
          role: 'assistant',
          content: `Analyzer output:\n${
            typeof analyzerRes.content === 'string' ? analyzerRes.content : ''
          }`,
        },
        {
          role: 'assistant',
          content: `Planner output:\n${
            typeof plannerRes.content === 'string' ? plannerRes.content : ''
          }`,
        },
        {
          role: 'user',
          content:
            'Execute the plan above using tools. If approval/consent is required, create a proposed Decision and stop.',
        },
      ]

      const exec = await withWorkspaceMcpClient({
        auth,
        workspaceId: shop.shopId,
        fn: (c) =>
          completePromptWithMcpTools(c, orchestratedTurns, {
            systemPromptSuffix: executorSuffix,
          }),
      })

      const totalTokens =
        analyzerRes.usage.totalTokens +
        plannerRes.usage.totalTokens +
        exec.totalTokens
      const promptTokens =
        analyzerRes.usage.promptTokens +
        plannerRes.usage.promptTokens +
        exec.promptTokens
      const completionTokens =
        analyzerRes.usage.completionTokens +
        plannerRes.usage.completionTokens +
        exec.completionTokens

      const userId = req.user?.id
      if (userId) {
        try {
          await aiUsageModel.recordAiTokenUsage({
            shopId: shop.shopId,
            userId,
            projectId: parsed.projectId ?? null,
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
          agentKey: ORCHESTRATOR_KEY,
          routerFallback: false,
        }
        const reqRow = await aiToolingTelemetryModel.recordAiToolingRequest({
          ctx,
          selectionMode: exec.tooling.selectionMode,
          selectionTokens: exec.tooling.selectionTokens,
          toolsTotalCount: exec.tooling.toolsTotalCount,
          toolsSelectedCount: exec.tooling.toolsSelectedCount,
          toolsPayloadBytes: exec.tooling.toolsPayloadBytes,
          toolRounds: exec.tooling.toolRounds,
          totalTokens,
          promptTokens,
          completionTokens,
        })
        for (const r of exec.tooling.rounds) {
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

      const normalized = normalizeAiReply(exec.reply)
      if (!normalized.ok) {
        logApiWarn('ai.empty_reply', {
          context: 'ai.postAi.orchestrator',
          shopId: shop.shopId,
          projectId: parsed.projectId ?? null,
        })
        res.status(502).json({
          error:
            'AI provider returned an empty response. Please retry in a moment.',
        })
        return
      }

      res.json({
        reply: redactAiReply(normalized.reply),
        usage: {
          tokens: totalTokens,
          intelebits: aiUsageModel.tokensToIntelebits(totalTokens),
          usagePercent: monthlyBudget?.usagePercent ?? 0,
          monthlyBudget,
        },
      })
      return
    }

    const { reply, totalTokens, promptTokens, completionTokens, tooling } =
      await withWorkspaceMcpClient({
        auth,
        workspaceId: shop.shopId,
        fn: (c) => completePromptWithMcpTools(c, parsed.turns, opts.options),
      })

    const normalized = normalizeAiReply(reply)
    if (!normalized.ok) {
      logApiWarn('ai.empty_reply', {
        context: 'ai.postAi.shop',
        shopId: shop.shopId,
        projectId: parsed.projectId ?? null,
      })
      res.status(502).json({
        error:
          'AI provider returned an empty response. Please retry in a moment.',
      })
      return
    }

    const userId = req.user?.id
    if (userId) {
      try {
        await aiUsageModel.recordAiTokenUsage({
          shopId: shop.shopId,
          userId,
          projectId: parsed.projectId ?? null,
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
      reply: redactAiReply(normalized.reply),
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
