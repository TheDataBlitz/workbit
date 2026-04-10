import type { Request, Response } from 'express'
import { routeToAgentKey } from '../ai/agentRouter.js'
import { AiNotConfiguredError } from '../ai/nvidia-client.js'
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
import { logApiError, logApiWarn } from '../utils/log.js'

/** Cap how many turns we send to NIM to limit tokens (each turn is user or assistant). */
const MAX_CHAT_MESSAGES = 48

const NO_ENABLED_AGENTS_SUFFIX = `## Agent role
No specialized agents are enabled for this project. Answer as the general Workbit assistant using the tools as usual.`

const BAD_BODY_MESSAGE =
  'Send { messages: [{ role: "user"|"assistant", content: string }, ...] } with a non-empty final user message, or legacy { prompt: string }. Optional: projectId, selectedAgentKey.'

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

  const entries = projectAgentsModel.catalogEntriesForKeys(enabledKeys)
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

  return okSuffixFromCatalogKey(agentKey, { fallback: usedFallback })
}

type CompletionOptionsResult =
  | { ok: true; options?: { systemPromptSuffix: string } }
  | { ok: false; status: number; error: string }

async function completionOptionsForParsedRequest(
  parsed: ParsedAiRequest
): Promise<CompletionOptionsResult> {
  const { projectId, selectedAgentKey, turns } = parsed

  // Start with any agent suffix (project-scoped).
  let systemPromptSuffix: string | undefined
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
  }

  // Note: Excalidraw-specific AI hinting intentionally removed; MCP Apps are rendered via ui:// resources.

  if (!systemPromptSuffix?.trim()) return { ok: true, options: undefined }
  return {
    ok: true,
    options: { systemPromptSuffix: systemPromptSuffix.trim() },
  }
}

function parseHtmlFromMcpResource(result: unknown): { html: string } | null {
  if (!result || typeof result !== 'object') return null
  const r = result as {
    contents?: Array<{
      // resources/read (SDK) shape: { uri, mimeType, text, _meta? }
      uri?: string
      mimeType?: string
      text?: string
      // some hosts/tools use content blocks with { type: "text", text, mimeType }
      type?: string
    }>
    content?: Array<{
      uri?: string
      mimeType?: string
      text?: string
      type?: string
    }>
  }
  const blocks = (
    Array.isArray(r.contents)
      ? r.contents
      : Array.isArray(r.content)
        ? r.content
        : []
  ) as Array<{ type?: string; text?: string; mimeType?: string }>

  const htmlBlock =
    blocks.find(
      (b) => typeof b.mimeType === 'string' && b.mimeType.includes('text/html')
    ) ??
    blocks.find(
      (b) => typeof b.text === 'string' && b.text.trim().startsWith('<')
    )

  const html = typeof htmlBlock?.text === 'string' ? htmlBlock.text : ''
  if (!html.trim()) return null
  return { html }
}

function getQueryString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

async function resolveShopIdForMcpResourceQuery(input: {
  shopId?: string | null
  projectId?: string | null
}): Promise<
  { ok: true; shopId: string } | { ok: false; status: number; error: string }
> {
  if (input.shopId?.trim()) return { ok: true, shopId: input.shopId.trim() }
  if (input.projectId?.trim()) {
    const wid = await workspaceModel.getWorkspaceIdForProject(input.projectId)
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
  return { ok: false, status: 400, error: 'shopId or projectId is required.' }
}

/**
 * GET /api/v1/ai/mcp-app-resource?shopId=...&toolName=...&resourceUri=ui://...
 * Returns HTML for rendering an MCP App View in the browser.
 */
export async function getMcpAppResource(req: Request, res: Response) {
  const auth = req.workbitUpstreamAuth
  if (!auth) {
    logApiError(
      new Error('getMcpAppResource: missing workbitUpstreamAuth'),
      'ai.getMcpAppResource'
    )
    res.status(500).json({ error: 'Invalid auth state for MCP resource.' })
    return
  }

  try {
    const shopId = getQueryString(req.query.shopId)
    const projectId = getQueryString(req.query.projectId)
    const toolName = getQueryString(req.query.toolName)
    const resourceUri = getQueryString(req.query.resourceUri)

    if (!toolName) {
      res.status(400).json({ error: 'toolName is required.' })
      return
    }
    if (!resourceUri || !resourceUri.startsWith('ui://')) {
      res.status(400).json({ error: 'resourceUri must start with ui://.' })
      return
    }

    const resolved = await resolveShopIdForMcpResourceQuery({
      shopId,
      projectId,
    })
    if (!resolved.ok) {
      res.status(resolved.status).json({ error: resolved.error })
      return
    }

    const html = await withWorkspaceMcpClient({
      auth,
      workspaceId: resolved.shopId,
      fn: async (client) => {
        if (!client.readResource) {
          throw new Error(
            'MCP resources are not supported by connected clients.'
          )
        }
        const resource = await client.readResource({
          uri: resourceUri,
          toolNameHint: toolName,
        })
        const parsed = parseHtmlFromMcpResource(resource)
        if (!parsed) {
          throw new Error('No HTML content found in MCP resource.')
        }
        return parsed.html
      },
    })

    res.setHeader('Cache-Control', 'private, no-store')
    res.json({ html })
  } catch (e) {
    logApiError(e, 'ai.getMcpAppResource')
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
  }
}

/**
 * POST /api/v1/ai/mcp-app-call-tool
 * Proxies MCP `tools/call` for an embedded MCP App iframe.
 */
export async function postMcpAppCallTool(req: Request, res: Response) {
  const auth = req.workbitUpstreamAuth
  if (!auth) {
    logApiError(
      new Error('postMcpAppCallTool: missing workbitUpstreamAuth'),
      'ai.postMcpAppCallTool'
    )
    res.status(500).json({ error: 'Invalid auth state for MCP tool call.' })
    return
  }

  try {
    const body = (req.body ?? {}) as {
      shopId?: string
      projectId?: string
      toolName?: string
      /** Tool name inside the embedded app (usually unprefixed) */
      name?: string
      arguments?: Record<string, unknown>
    }

    const shopId = typeof body.shopId === 'string' ? body.shopId.trim() : ''
    const projectId =
      typeof body.projectId === 'string' ? body.projectId.trim() : ''
    const toolNameHint =
      typeof body.toolName === 'string' ? body.toolName.trim() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const args =
      body.arguments && typeof body.arguments === 'object' ? body.arguments : {}

    if (!toolNameHint) {
      res.status(400).json({ error: 'toolName is required.' })
      return
    }
    if (!name) {
      res.status(400).json({ error: 'name is required.' })
      return
    }

    const resolved = await resolveShopIdForMcpResourceQuery({
      shopId: shopId || null,
      projectId: projectId || null,
    })
    if (!resolved.ok) {
      res.status(resolved.status).json({ error: resolved.error })
      return
    }

    const prefix = toolNameHint.includes('.')
      ? toolNameHint.split('.')[0]
      : toolNameHint
    const compositeToolName = prefix ? `${prefix}.${name}` : name

    const result = await withWorkspaceMcpClient({
      auth,
      workspaceId: resolved.shopId,
      fn: async (client) => {
        return await client.callTool({
          name: compositeToolName,
          arguments: args,
        })
      },
    })

    res.setHeader('Cache-Control', 'private, no-store')
    res.json(result)
  } catch (e) {
    logApiError(e, 'ai.postMcpAppCallTool')
    res.status(400).json({ error: e instanceof Error ? e.message : String(e) })
  }
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

    const { reply, totalTokens, attachments } = await withWorkspaceMcpClient({
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
        })
      } catch (err) {
        logApiWarn('ai.token_usage_persist_failed', {
          context: 'ai.postAi',
          shopId: shop.shopId,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    }

    const monthlyBudget = await aiUsageModel.getShopMonthlyBudget(shop.shopId)

    res.json({
      reply,
      attachments,
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
