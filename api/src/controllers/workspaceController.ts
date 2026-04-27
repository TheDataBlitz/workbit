import type { Request, Response } from 'express'
import * as workspaceModel from '../models/workspace.js'
import * as workspacesModel from '../models/workspaces.js'
import * as workspaceMcpToolsModel from '../models/workspaceMcpTools.js'
import { logApiError } from '../utils/log.js'
import {
  findSupabaseUserByEmail,
  createSupabaseUserForMember,
} from '../utils/supabaseUsers.js'

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  )
    return (err as { message: string }).message
  if (typeof err === 'string') return err
  return JSON.stringify(err)
}

function sendError(res: Response, err: unknown, status = 500) {
  res.status(status).json({ error: toErrorMessage(err) })
}

// ----------------------------
// /api/v1/workspaces (collection)
// ----------------------------

export async function getWorkspaces(req: Request, res: Response) {
  try {
    const memberId = (req.query.memberId as string | undefined) ?? undefined

    if (!memberId) {
      sendError(res, 'memberId is required', 400)
      return
    }

    const workspaces = await workspacesModel.getWorkspacesByMemberId(memberId)

    res.json(
      workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        region: w.region,
      }))
    )
  } catch (e) {
    logApiError(e, 'workspaces.getWorkspaces')
    sendError(res, e)
  }
}

export async function createWorkspace(req: Request, res: Response) {
  try {
    const { name, slug, region, memberId } = req.body as {
      name?: string
      slug?: string
      region?: string
      memberId?: string
    }

    if (!name || typeof name !== 'string') {
      sendError(res, 'name is required', 400)
      return
    }

    if (!slug || typeof slug !== 'string') {
      sendError(res, 'slug is required', 400)
      return
    }

    if (!memberId || typeof memberId !== 'string') {
      sendError(res, 'memberId is required', 400)
      return
    }

    try {
      const workspace = await workspacesModel.createWorkspace({
        name,
        slug,
        region,
        memberId,
      })

      res.status(201).json({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        region: workspace.region,
      })
    } catch (err) {
      const e = err as Error & { code?: string }
      if (e.code === 'WORKSPACE_SLUG_TAKEN') {
        sendError(res, e.message, 409)
        return
      }
      throw e
    }
  } catch (e) {
    logApiError(e, 'workspaces.createWorkspace')
    sendError(res, e)
  }
}

export async function updateWorkspace(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId
    if (!workspaceId) {
      sendError(res, 'workspaceId is required', 400)
      return
    }

    const { name, slug, region } = req.body as {
      name?: unknown
      slug?: unknown
      region?: unknown
    }

    const patch: { name?: string; slug?: string; region?: string } = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        sendError(res, 'name must be a non-empty string', 400)
        return
      }
      patch.name = name
    }
    if (slug !== undefined) {
      if (typeof slug !== 'string' || !slug.trim()) {
        sendError(res, 'slug must be a non-empty string', 400)
        return
      }
      patch.slug = slug
    }
    if (region !== undefined) {
      if (typeof region !== 'string' || !region.trim()) {
        sendError(res, 'region must be a non-empty string', 400)
        return
      }
      patch.region = region
    }

    if (Object.keys(patch).length === 0) {
      sendError(res, 'No fields to update', 400)
      return
    }

    try {
      const updated = await workspacesModel.updateWorkspace({
        workspaceId,
        ...patch,
      })
      if (!updated) {
        res.status(404).json({ error: 'Workspace not found' })
        return
      }
      res.json({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        region: updated.region,
      })
    } catch (err) {
      const e = err as Error & { code?: string }
      if (e.code === 'WORKSPACE_SLUG_TAKEN') {
        sendError(res, e.message, 409)
        return
      }
      throw e
    }
  } catch (e) {
    logApiError(e, 'workspaces.updateWorkspace', {
      workspaceId: req.params.workspaceId,
    })
    sendError(res, e)
  }
}

// -----------------------------------------
// /api/v1/workspaces/:workspaceId/mcp-tools
// -----------------------------------------

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

export async function listWorkspaceMcpTools(req: Request, res: Response) {
  try {
    const workspaceId = req.params.workspaceId
    if (!workspaceId) {
      sendError(res, 'workspaceId is required', 400)
      return
    }
    const rows = await workspaceMcpToolsModel.listWorkspaceMcpTools(workspaceId)
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

export async function setWorkspaceMcpTool(req: Request, res: Response) {
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

    const row = await workspaceMcpToolsModel.setWorkspaceMcpTool({
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

export async function getProjects(_req: Request, res: Response) {
  try {
    const list = await workspaceModel.getProjectsForApi()
    res.json(list)
  } catch (e) {
    logApiError(e, 'workspace.getProjects')
    sendError(res, e)
  }
}

export async function getMembers(_req: Request, res: Response) {
  try {
    const list = await workspaceModel.getMembersForApi()
    res.json(list)
  } catch (e) {
    logApiError(e, 'workspace.getMembers')
    sendError(res, e)
  }
}

export async function inviteMember(req: Request, res: Response) {
  try {
    const { email } = req.body as { email?: string }
    if (!email || typeof email !== 'string') {
      sendError(res, 'email is required', 400)
      return
    }
    const invitation = await workspaceModel.inviteMember(email)
    res.status(201).json(invitation)
  } catch (e) {
    logApiError(e, 'workspace.inviteMember')
    sendError(res, e)
  }
}

export async function createMember(req: Request, res: Response) {
  try {
    const { name, username, status, email } = req.body as {
      name?: string
      username?: string
      status?: string
      email?: string
    }

    if (!name || typeof name !== 'string') {
      sendError(res, 'name is required', 400)
      return
    }

    if (!username || typeof username !== 'string') {
      sendError(res, 'username is required', 400)
      return
    }

    if (!email || typeof email !== 'string') {
      sendError(res, 'email is required', 400)
      return
    }

    const memberStatus =
      typeof status === 'string' && status ? status : 'Member'

    let authUserId: string | null = null
    try {
      const existing = await findSupabaseUserByEmail(email)
      const user = existing ?? (await createSupabaseUserForMember(email))
      authUserId = user?.id ?? null
    } catch {
      authUserId = null
    }

    const member = await workspaceModel.createMember({
      name,
      username,
      status: memberStatus,
      email,
      uid: authUserId,
      userAuthId: authUserId,
      provisioned: Boolean(authUserId),
    })

    res.status(201).json(member)
  } catch (e) {
    logApiError(e, 'workspace.createMember')
    sendError(res, e)
  }
}

export async function provisionMember(req: Request, res: Response) {
  try {
    const { memberId } = req.params as { memberId: string }
    const { email } = req.body as { email?: string }

    if (!memberId) {
      sendError(res, 'memberId is required', 400)
      return
    }

    if (!email || typeof email !== 'string') {
      sendError(res, 'email is required', 400)
      return
    }

    const existing = await findSupabaseUserByEmail(email)
    const user = existing ?? (await createSupabaseUserForMember(email))

    if (!user || !user.id) {
      sendError(res, 'Failed to resolve Supabase user', 500)
      return
    }

    const member = await workspaceModel.provisionMember(memberId, user.id)

    res.status(200).json(member)
  } catch (e) {
    logApiError(e, 'workspace.provisionMember')
    sendError(res, e)
  }
}

export async function updateMember(req: Request, res: Response) {
  try {
    const { memberId } = req.params as { memberId: string }
    if (!memberId) {
      sendError(res, 'memberId is required', 400)
      return
    }

    const { name, username, avatarSrc, status, provisioned } = req.body as {
      name?: unknown
      username?: unknown
      avatarSrc?: unknown
      status?: unknown
      provisioned?: unknown
    }

    const patch: {
      name?: string
      username?: string
      avatarSrc?: string
      status?: string
      provisioned?: boolean
    } = {}

    if (name !== undefined) {
      if (typeof name !== 'string') {
        sendError(res, 'name must be a string', 400)
        return
      }
      patch.name = name
    }
    if (username !== undefined) {
      if (typeof username !== 'string') {
        sendError(res, 'username must be a string', 400)
        return
      }
      patch.username = username
    }
    if (avatarSrc !== undefined) {
      if (avatarSrc !== null && typeof avatarSrc !== 'string') {
        sendError(res, 'avatarSrc must be a string or null', 400)
        return
      }
      patch.avatarSrc = typeof avatarSrc === 'string' ? avatarSrc : undefined
    }
    if (status !== undefined) {
      if (typeof status !== 'string') {
        sendError(res, 'status must be a string', 400)
        return
      }
      patch.status = status
    }
    if (provisioned !== undefined) {
      if (typeof provisioned !== 'boolean') {
        sendError(res, 'provisioned must be a boolean', 400)
        return
      }
      patch.provisioned = provisioned
    }

    const updated = await workspaceModel.updateMemberForApi(memberId, patch)
    res.status(200).json(updated)
  } catch (e) {
    logApiError(e, 'workspace.updateMember')
    sendError(res, e)
  }
}

export async function createProject(req: Request, res: Response) {
  try {
    const { name, description, workspaceId, status } = req.body as {
      name?: string
      description?: string
      workspaceId?: string
      status?: string
    }

    if (!name || typeof name !== 'string') {
      sendError(res, 'name is required', 400)
      return
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      sendError(res, 'workspaceId is required', 400)
      return
    }

    const { project } = await workspaceModel.createProject({
      name,
      description,
      workspaceId,
      status,
    })

    res.status(201).json({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
    })
  } catch (e) {
    logApiError(e, 'workspace.createProject')
    sendError(res, e)
  }
}
