import type { Request, Response } from 'express'
import * as model from '../models/workspaceMcpTools.js'
import { logApiError } from '../utils/log.js'

function sendError(res: Response, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err)
  res.status(status).json({ error: message })
}

/** Built-in catalog entries (metadata + optional default base URL). Add tools here; DB-only rows still appear in list. */
type CatalogTool = {
  toolKey: string
  name: string
  description: string
  defaultBaseUrl: string | null
}

function toolCatalog(): readonly CatalogTool[] {
  return []
}

export async function listTools(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId
    if (!workspaceId) {
      sendError(res, 'workspaceId is required', 400)
      return
    }
    const rows = await model.listWorkspaceMcpTools(workspaceId)
    const byKey = new Map(rows.map((r) => [r.toolKey, r]))
    const catalog = toolCatalog()
    const catalogKeys = new Set(catalog.map((c) => c.toolKey))

    const fromCatalog = catalog.map((t) => {
      const row = byKey.get(t.toolKey)
      return {
        toolKey: t.toolKey,
        name: t.name,
        description: t.description,
        enabled: row?.enabled ?? false,
        baseUrl: row?.baseUrl ?? t.defaultBaseUrl,
        hasToken: Boolean(row?.accessToken),
      }
    })

    const fromDbOnly = rows
      .filter((r) => !catalogKeys.has(r.toolKey))
      .map((r) => ({
        toolKey: r.toolKey,
        name: r.toolKey,
        description:
          'External MCP server at the configured base URL (streamable HTTP MCP).',
        enabled: r.enabled,
        baseUrl: r.baseUrl,
        hasToken: Boolean(r.accessToken),
      }))

    const tools = [...fromCatalog, ...fromDbOnly].sort((a, b) =>
      a.toolKey.localeCompare(b.toolKey)
    )
    res.json({ tools })
  } catch (e) {
    logApiError(e, 'workspaceMcpTools.listTools')
    sendError(res, e)
  }
}

export async function setTool(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId
    const toolKey = req.params.toolKey?.trim()
    const { enabled, baseUrl, token } = req.body as {
      enabled?: boolean
      baseUrl?: string
      token?: string
    }
    if (!workspaceId) {
      sendError(res, 'workspaceId is required', 400)
      return
    }
    if (!toolKey) {
      sendError(res, 'toolKey is required', 400)
      return
    }
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      sendError(res, 'enabled must be boolean', 400)
      return
    }
    const catalog = toolCatalog()
    const catalogItem = catalog.find((c) => c.toolKey === toolKey)
    const base =
      typeof baseUrl === 'string' && baseUrl.trim()
        ? baseUrl.trim()
        : (catalogItem?.defaultBaseUrl ?? null)
    const tok = typeof token === 'string' && token.trim() ? token.trim() : null

    const row = await model.setWorkspaceMcpTool({
      workspaceId,
      toolKey,
      enabled: Boolean(enabled),
      baseUrl: base,
      accessToken: tok,
    })
    res.json({
      toolKey: row.toolKey,
      enabled: row.enabled,
      baseUrl: row.baseUrl,
      hasToken: Boolean(row.accessToken),
      updatedAt: row.updatedAt,
    })
  } catch (e) {
    logApiError(e, 'workspaceMcpTools.setTool')
    sendError(res, e)
  }
}
