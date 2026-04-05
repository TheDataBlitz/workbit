import type { Request, Response } from 'express'
import { routeToAgentKey } from '../ai/agentRouter.js'
import { AiNotConfiguredError } from '../ai/nvidia-client.js'
import {
  completePromptWithMcpTools,
  type AiChatTurn,
} from '../ai/mcp/completeWithMcpTools.js'
import { withMcpClient } from '../ai/mcp/workbit-mcp-client.js'
import {
  getAgentCatalogEntry,
  isValidAgentKey,
} from '../models/agentCatalog.js'
import * as projectAgentsModel from '../models/projectAgents.js'
import * as workspaceModel from '../models/workspace.js'
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

  const fromMessages = parseMessagesArray(b.messages)
  if (fromMessages) {
    return { turns: fromMessages, projectId, selectedAgentKey }
  }

  if (typeof b.prompt === 'string' && b.prompt.trim()) {
    return {
      turns: [{ role: 'user', content: b.prompt.trim() }],
      projectId,
      selectedAgentKey,
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
  if (!projectId) {
    return { ok: true, options: undefined }
  }

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

  if (!resolved.systemPromptSuffix) {
    return { ok: true, options: undefined }
  }

  return {
    ok: true,
    options: { systemPromptSuffix: resolved.systemPromptSuffix },
  }
}

/**
 * POST /api/v1/ai — body: `{ messages, projectId?, selectedAgentKey? }` or legacy `{ prompt, ... }` → `{ reply }`.
 * Last message must be `user`. Uses Workbit MCP + NIM.
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
    const opts = await completionOptionsForParsedRequest(parsed)
    if (!opts.ok) {
      res.status(opts.status).json({ error: opts.error })
      return
    }

    const reply = await withMcpClient(auth, (c) =>
      completePromptWithMcpTools(c, parsed.turns, opts.options)
    )
    res.json({ reply })
  } catch (e) {
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
