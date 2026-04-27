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
        const name = key === 'workbit' ? t.name : `${key}.${t.name}`
        toolToClient.set(name, { client, name: t.name })
        merged.push({
          ...t,
          name,
          ...(key === 'workbit'
            ? {}
            : {
                description: t.description
                  ? `[${key}] ${t.description}`
                  : `[${key}] ${t.name}`,
              }),
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

  return { listTools, callTool }
}
