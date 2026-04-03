import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import type { WorkbitUpstreamAuth } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function defaultMcpEntryPath(): string {
  return path.resolve(
    __dirname,
    '../../../mcp/workbit-mcp-server/build/index.js'
  )
}

function getMcpSpawnConfig(): { command: string; args: string[] } {
  const command = process.env.WORKBIT_MCP_COMMAND ?? 'node'
  const raw = process.env.WORKBIT_MCP_ARGS
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string')) {
        return { command, args: parsed }
      }
    } catch {
      // invalid WORKBIT_MCP_ARGS; fall through
    }
  }
  if (process.env.WORKBIT_MCP_ENTRY) {
    return { command, args: [process.env.WORKBIT_MCP_ENTRY] }
  }
  return { command, args: [defaultMcpEntryPath()] }
}

/**
 * Env vars merged (after getDefaultEnvironment()) into the MCP subprocess.
 * One spawn per request keeps credentials isolated; pooling would require care.
 */
function mcpChildEnvOverrides(
  auth: WorkbitUpstreamAuth
): Record<string, string> {
  const port = 3001
  const apiBase = `http://127.0.0.1:${port}/api/v1`

  const env: Record<string, string> = {
    WORKBIT_API_BASE_URL: apiBase,
  }

  if (auth.kind === 'bearer') {
    env.WORKBIT_BEARER_TOKEN = auth.token
  } else {
    env.WORKBIT_API_KEY = auth.secret
  }

  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv !== undefined) env.NODE_ENV = nodeEnv

  return env
}

export async function withMcpClient<T>(
  auth: WorkbitUpstreamAuth,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const { command, args } = getMcpSpawnConfig()
  const transport = new StdioClientTransport({
    command,
    args,
    env: mcpChildEnvOverrides(auth),
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
