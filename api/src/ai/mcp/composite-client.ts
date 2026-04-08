import type { Client } from '@modelcontextprotocol/sdk/client/index.js'

type ToolRecord = Awaited<ReturnType<Client['listTools']>>['tools'][number]

export type McpClientLike = {
  listTools: (req?: { cursor?: string }) => Promise<{
    tools: ToolRecord[]
    nextCursor?: string
  }>
  callTool: (req: {
    name: string
    arguments?: Record<string, unknown>
  }) => Promise<unknown>
  /**
   * Read an MCP resource (used for MCP Apps `ui://...`).
   * `toolNameHint` lets composites route to the same server that declared the tool.
   */
  readResource?: (req: {
    uri: string
    toolNameHint?: string
  }) => Promise<unknown>
}

export function createCompositeMcpClient(input: {
  /** key -> connected client */
  clients: Array<{ key: string; client: McpClientLike }>
}): McpClientLike {
  const toolToClient = new Map<
    string,
    { client: McpClientLike; name: string }
  >()
  let cachedTools: ToolRecord[] | null = null

  async function listTools(): Promise<{
    tools: ToolRecord[]
    nextCursor?: string
  }> {
    if (cachedTools) {
      return { tools: cachedTools }
    }

    const merged: ToolRecord[] = []
    for (const { key, client } of input.clients) {
      const page = await client.listTools()
      for (const t of page.tools ?? []) {
        const prefixed = `${key}.${t.name}`
        toolToClient.set(prefixed, { client, name: t.name })
        merged.push({
          ...t,
          name: prefixed,
          description: t.description
            ? `[${key}] ${t.description}`
            : `[${key}] ${t.name}`,
        })
      }
    }

    cachedTools = merged
    return { tools: merged }
  }

  async function callTool(inputCall: {
    name: string
    arguments?: Record<string, unknown>
  }): Promise<unknown> {
    const hit = toolToClient.get(inputCall.name)
    if (!hit) {
      throw new Error(`Unknown tool: ${inputCall.name}`)
    }
    return await hit.client.callTool({
      name: hit.name,
      arguments: inputCall.arguments ?? {},
    })
  }

  async function readResource(req: {
    uri: string
    toolNameHint?: string
  }): Promise<unknown> {
    const toolName = req.toolNameHint
    if (toolName) {
      const hit = toolToClient.get(toolName)
      if (hit?.client.readResource) {
        return await hit.client.readResource({ uri: req.uri })
      }
    }
    // Best-effort: first client that supports resources.
    const first = input.clients.find((c) => Boolean(c.client.readResource))
    if (!first?.client.readResource) {
      throw new Error('MCP resources are not supported by connected clients.')
    }
    return await first.client.readResource({ uri: req.uri })
  }

  return { listTools, callTool, readResource }
}
