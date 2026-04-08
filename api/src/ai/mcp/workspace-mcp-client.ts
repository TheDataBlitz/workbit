import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { WorkbitUpstreamAuth } from '../../middleware/auth.js'
import { withMcpClient } from './workbit-mcp-client.js'
import {
  createCompositeMcpClient,
  type McpClientLike,
} from './composite-client.js'
import * as workspaceMcpToolsModel from '../../models/workspaceMcpTools.js'

const DEFAULT_EXCALIDRAW_MCP_BASE_URL =
  process.env.EXCALIDRAW_MCP_BASE_URL?.trim() || 'http://localhost:3005/mcp'

export async function withWorkspaceMcpClient<T>(input: {
  auth: WorkbitUpstreamAuth
  workspaceId: string
  fn: (client: McpClientLike) => Promise<T>
}): Promise<T> {
  // 1) connect internal Workbit MCP (stdio)
  return await withMcpClient(input.auth, async (internal) => {
    // 2) connect enabled external MCP tools (HTTP/streamable)
    const enabled = await workspaceMcpToolsModel.listEnabledWorkspaceMcpTools(
      input.workspaceId
    )
    console.log('enabled', enabled)
    const externalClients: Array<{
      key: string
      client: McpClientLike
      close: () => Promise<void>
    }> = []

    for (const t of enabled) {
      const baseUrl =
        t.toolKey === 'excalidraw_mcp'
          ? DEFAULT_EXCALIDRAW_MCP_BASE_URL
          : t.baseUrl?.trim()
      if (!baseUrl) continue
      const headers: Record<string, string> = {}
      if (t.accessToken?.trim()) {
        headers.Authorization = `Bearer ${t.accessToken.trim()}`
      }
      headers.Accept = 'application/json, text/event-stream'
      const transport = new StreamableHTTPClientTransport(new URL(baseUrl), {
        requestInit: { headers },
      })
      const c = new Client({
        name: `workbit-external-${t.toolKey}`,
        version: '1.0.0',
      })
      await c.connect(transport)
      externalClients.push({
        key: t.toolKey,
        client: c as unknown as McpClientLike,
        close: async () => c.close(),
      })
    }

    const composite = createCompositeMcpClient({
      clients: [
        { key: 'workbit', client: internal as unknown as McpClientLike },
        ...externalClients.map((e) => ({ key: e.key, client: e.client })),
      ],
    })

    try {
      return await input.fn(composite)
    } finally {
      await Promise.allSettled(externalClients.map((e) => e.close()))
    }
  })
}
