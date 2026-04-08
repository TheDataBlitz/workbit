import type { Request, Response } from 'express'
import * as model from '../models/workspaceMcpTools.js'
import { withRemoteMcpClient } from '../ai/mcp/remote-mcp-client.js'
import { logApiError } from '../utils/log.js'

function sendError(res: Response, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err)
  res.status(status).json({ error: message })
}

const DEFAULT_EXCALIDRAW_MCP_BASE_URL =
  process.env.EXCALIDRAW_MCP_BASE_URL?.trim() || 'http://localhost:3005/mcp'

function toolCatalog() {
  return [
    {
      toolKey: 'excalidraw_mcp',
      name: 'Excalidraw',
      description: 'Streamable Excalidraw MCP app server (HTTP /mcp).',
      defaultBaseUrl: DEFAULT_EXCALIDRAW_MCP_BASE_URL,
    },
  ] as const
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
    const out = toolCatalog().map((t) => {
      const row = byKey.get(t.toolKey)
      return {
        toolKey: t.toolKey,
        name: t.name,
        description: t.description,
        enabled: row?.enabled ?? false,
        baseUrl: row?.baseUrl ?? t.defaultBaseUrl ?? null,
        hasToken: Boolean(row?.accessToken),
      }
    })
    res.json({ tools: out })
  } catch (e) {
    logApiError(e, 'workspaceMcpTools.listTools')
    sendError(res, e)
  }
}

export async function setTool(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId
    const toolKey = req.params.toolKey
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

export async function testTool(req: Request, res: Response) {
  try {
    const { baseUrl, token } = req.body as { baseUrl?: string; token?: string }
    const base = typeof baseUrl === 'string' ? baseUrl.trim() : ''
    if (!base) {
      sendError(res, 'baseUrl is required', 400)
      return
    }
    const tools = await withRemoteMcpClient({
      baseUrl: base,
      bearerToken: typeof token === 'string' ? token : undefined,
      fn: async (client) => {
        const r = await client.listTools()
        return r.tools?.map((t) => ({
          name: t.name,
          description: t.description ?? '',
        }))
      },
    })
    res.json({ ok: true, tools: tools ?? [] })
  } catch (e) {
    logApiError(e, 'workspaceMcpTools.testTool')
    sendError(res, e, 400)
  }
}
