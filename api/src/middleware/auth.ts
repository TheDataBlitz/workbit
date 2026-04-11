import type { Request, Response, NextFunction } from 'express'
import { supabaseAdmin, isSupabaseConfigured } from '../utils/supabaseServer.js'

export interface AuthUser {
  id: string
  email: string | undefined
}

/** Credential to pass to the Workbit MCP subprocess so tools can call this API as the same principal. */
export type WorkbitUpstreamAuth =
  | { kind: 'bearer'; token: string }
  | { kind: 'apiKey'; secret: string }

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser
    /** Set by optionalAuth when JWT or API key auth succeeds; used by MCP proxy only. Never log. */
    workbitUpstreamAuth?: WorkbitUpstreamAuth
  }
}

const BEARER_PREFIX = 'Bearer '
const X_API_KEY = 'x-api-key'

/**
 * Optional auth: if Supabase is configured, tries in order:
 * 1. Authorization Bearer token as Supabase JWT -> sets req.user
 * 2. If no user, X-API-Key or Bearer as API key -> lookup api_keys, set req.user by user_id
 * Otherwise req.user stays undefined.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (req.method === 'OPTIONS') {
    next()
    return
  }
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    next()
    return
  }

  const authHeader = req.headers.authorization
  const apiKeyHeader = req.headers[X_API_KEY] as string | undefined
  const token = authHeader?.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length)
    : undefined
  const apiKeyRaw = apiKeyHeader ?? token

  // 1. Try Bearer as Supabase JWT
  if (token) {
    try {
      const {
        data: { user },
        error,
      } = await supabaseAdmin.auth.getUser(token)
      if (!error && user) {
        req.user = { id: user.id, email: user.email }
        req.workbitUpstreamAuth = { kind: 'bearer', token }
        next()
        return
      }
    } catch {
      // Not a valid JWT; fall through to API key
    }
  }

  // 2. Try API key (X-API-Key header or Bearer if not a JWT)
  if (apiKeyRaw) {
    const { data: row } = await supabaseAdmin
      .from('api_keys')
      .select('user_id')
      .eq('secret', apiKeyRaw)
      .maybeSingle()
    if (row?.user_id) {
      req.user = { id: row.user_id, email: undefined }
      req.workbitUpstreamAuth = { kind: 'apiKey', secret: apiKeyRaw }
    }
  }

  next()
}

/**
 * Requires a valid session on `/api/v1/*` except `/api/v1/auth/*` (login/signup).
 * 501 if Supabase is not configured; 401 if no `req.user` (set by `optionalAuth`).
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Mounted at /api/v1 — req.path is e.g. /auth/login or /workspace/members, not /api/v1/...
  if (req.method === 'OPTIONS') {
    next()
    return
  }
  if (req.path === '/auth' || req.path.startsWith('/auth/')) {
    next()
    return
  }
  if (!isSupabaseConfigured()) {
    res.status(501).json({ error: 'Auth not configured' })
    return
  }
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}

export function getUserId(req: Request, defaultId: string): string {
  return req.user?.id ?? defaultId
}
