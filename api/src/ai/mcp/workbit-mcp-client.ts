import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { WorkbitUpstreamAuth } from '../../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MCP_REL_SEGMENTS = 'mcp/workbit-mcp-server/build/index.js'

/**
 * Resolve the Workbit MCP server entry (built `index.js`).
 * Tries: `WORKBIT_MCP_ENTRY`, path relative to this module, then common cwd layouts (`api/` or repo root).
 */
function resolveWorkbitMcpScript(): string {
  const env = process.env.WORKBIT_MCP_ENTRY?.trim()
  if (env) {
    return path.isAbsolute(env) ? env : path.resolve(process.cwd(), env)
  }

  const candidates = [
    path.resolve(__dirname, '../../../../', MCP_REL_SEGMENTS),
    path.resolve(process.cwd(), '..', MCP_REL_SEGMENTS),
    path.resolve(process.cwd(), MCP_REL_SEGMENTS),
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  throw new Error(
    `Workbit MCP server not found (build with: cd mcp/workbit-mcp-server && npm run build). Tried:\n${candidates.map((p) => `  - ${p}`).join('\n')}\nSet WORKBIT_MCP_ENTRY to the absolute path to build/index.js if it lives elsewhere.`
  )
}

/** Matches `api/src/index.ts` listen port so the MCP child hits this process. */
const apiListenPort = () => Number(process.env.PORT) || 3001

function mcpChildEnv(auth: WorkbitUpstreamAuth): Record<string, string> {
  return {
    WORKBIT_API_BASE_URL: `http://127.0.0.1:${apiListenPort()}/api/v1`,
    ...(auth.kind === 'bearer'
      ? { WORKBIT_BEARER_TOKEN: auth.token }
      : { WORKBIT_API_KEY: auth.secret }),
    ...(process.env.NODE_ENV !== undefined && {
      NODE_ENV: process.env.NODE_ENV,
    }),
  }
}

export async function withMcpClient<T>(
  auth: WorkbitUpstreamAuth,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const scriptPath = resolveWorkbitMcpScript()
  const transport = new StdioClientTransport({
    command: 'node',
    args: [scriptPath],
    env: mcpChildEnv(auth),
    stderr: 'inherit',
  })

  const client = new Client({ name: 'workbit-api', version: '1.0.0' })
  await client.connect(transport)
  try {
    return await fn(client)
  } finally {
    await client.close()
  }
}
