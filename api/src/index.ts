import './loadEnv.js'
import { init as initLogbit, logbit } from '@thedatablitz/logbit-sdk'
import express from 'express'

initLogbit({
  service: 'workbit-api',
  env: process.env.NODE_ENV ?? 'development',
  release: process.env.APP_VERSION ?? '0.0.1',
  ...(process.env.LOGBIT_API_BASE_URL && {
    apiBaseUrl: process.env.LOGBIT_API_BASE_URL,
  }),
  ...(process.env.VITE_WORK_BIT_API_KEY && {
    workbit: { apiKey: process.env.VITE_WORK_BIT_API_KEY },
  }),
})
import cors from 'cors'

function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS
  const fromEnv = raw
    ? raw
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  const defaults = [
    'https://workbit.thedatablitz.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]
  return [...new Set([...defaults, ...fromEnv])]
}
import { optionalAuth, requireAuth } from './middleware/auth.js'
import { workspaceRoutes } from './routes/workspace.js'
import { workspacesRoutes } from './routes/workspaces.js'
import { teamsRoutes } from './routes/teams.js'
import { issuesRoutes } from './routes/issues.js'
import { meRoutes } from './routes/me.js'
import { authRoutes } from './routes/auth.js'
import { apiKeysRoutes } from './routes/apiKeys.js'
import { isSupabaseConfigured } from './utils/supabaseServer.js'
import { LOGBIT_PROJECT_ID } from './utils/log.js'
import { projectRoutes } from './routes/project.js'
import { aiRoutes } from './routes/ai.js'
import { agentsRoutes } from './routes/agents.js'
import { workspaceMcpToolsRoutes } from './routes/workspaceMcpTools.js'

const DEFAULT_PORT = 3001
const API_PREFIX = '/api/v1'

const app = express()
const corsOrigins = parseCorsOrigins()
const corsOptions: cors.CorsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser clients (no Origin header) and allowlisted browser origins.
    if (!origin) return cb(null, true)
    if (corsOrigins.includes(origin)) return cb(null, true)
    return cb(null, false)
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-api-key'],
  maxAge: 86_400,
}
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
// Lexical editor content (and occasional embedded assets) can exceed the default
// body-parser limit (~100kb). Keep this modest to avoid abuse but large enough
// for typical editor payloads.
app.use(express.json({ limit: '5mb' }))

app.use(API_PREFIX, optionalAuth)
app.use(API_PREFIX, requireAuth)
app.use(`${API_PREFIX}/auth`, authRoutes)
app.use(`${API_PREFIX}/workspaces`, workspacesRoutes)
app.use(
  `${API_PREFIX}/workspaces/:workspaceId/mcp-tools`,
  workspaceMcpToolsRoutes
)
app.use(`${API_PREFIX}/workspace`, workspaceRoutes)
app.use(`${API_PREFIX}/projects`, projectRoutes)
app.use(`${API_PREFIX}/teams`, teamsRoutes)
app.use(`${API_PREFIX}/issues`, issuesRoutes)
app.use(`${API_PREFIX}/me`, meRoutes)
app.use(`${API_PREFIX}/keys`, apiKeysRoutes)
app.use(`${API_PREFIX}/ai`, aiRoutes)
app.use(`${API_PREFIX}/agents`, agentsRoutes)

app.get('/health', (_req, res) => res.json({ ok: true }))

async function start() {
  const port = Number(process.env.PORT) || DEFAULT_PORT
  const usingSupabase = isSupabaseConfigured()
  console.log(
    `[Store] Using ${usingSupabase ? 'Supabase' : 'file (data.json)'}. SUPABASE_URL set: ${Boolean(process.env.SUPABASE_URL)}. SUPABASE_SERVICE_ROLE_KEY set: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)}.`
  )
  app.listen(port, '0.0.0.0', () => {
    console.log(
      `API listening on http://0.0.0.0:${port} (reachable at http://localhost:${port} on this machine; use your LAN IP from a phone)`
    )
  })
}

start().catch((err) => {
  logbit.error('Failed to start API', {
    projectId: LOGBIT_PROJECT_ID,
    title: 'Failed to start API',
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  })
  process.exit(1)
})
