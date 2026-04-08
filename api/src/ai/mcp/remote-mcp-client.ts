import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export async function withRemoteMcpClient<T>(input: {
  baseUrl: string
  bearerToken?: string
  fn: (client: Client) => Promise<T>
}): Promise<T> {
  const headers: Record<string, string> = {}
  if (input.bearerToken?.trim()) {
    headers.Authorization = `Bearer ${input.bearerToken.trim()}`
  }
  // Some Streamable HTTP MCP servers require the client to accept both JSON and SSE.
  if (!('Accept' in headers)) {
    headers.Accept = 'application/json, text/event-stream'
  }
  const transport = new StreamableHTTPClientTransport(new URL(input.baseUrl), {
    requestInit: {
      headers,
    },
  })

  const client = new Client({ name: 'workbit-api-remote', version: '1.0.0' })
  await client.connect(transport)
  try {
    return await input.fn(client)
  } finally {
    await client.close()
  }
}
