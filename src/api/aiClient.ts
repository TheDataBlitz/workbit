import { authFetch } from './client'

export type AiChatTurn = {
  role: 'user' | 'assistant'
  content: string
}

export type PostAiBody =
  | { messages: AiChatTurn[]; projectId?: string; shopId?: string }
  | { prompt: string; projectId?: string; shopId?: string }

export type PostAiUsage = {
  tokens: number
  intelebits: number
  /** % of workspace monthly Intelebit cap used (UTC month), after this request. */
  usagePercent: number
  monthlyBudget: {
    capIntelebits: number
    usedIntelebits: number
    usagePercent: number
  } | null
}

export type PostAiAttachment = {
  kind: 'mcp_app'
  resourceUri: string
  toolName: string
  title?: string
}

/** POST /api/v1/ai — `{ messages }` (or legacy `{ prompt }`) → `{ reply, usage? }` */
export async function postAiPrompt(body: PostAiBody): Promise<{
  reply: string
  attachments?: PostAiAttachment[]
  usage?: PostAiUsage
}> {
  return authFetch('/ai', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{
    reply: string
    attachments?: PostAiAttachment[]
    usage?: PostAiUsage
  }>
}

export async function getMcpAppResource(input: {
  toolName: string
  resourceUri: string
  shopId?: string
  projectId?: string
}): Promise<{ html: string }> {
  const params = new URLSearchParams()
  if (input.shopId?.trim()) params.set('shopId', input.shopId.trim())
  if (input.projectId?.trim()) params.set('projectId', input.projectId.trim())
  params.set('toolName', input.toolName)
  params.set('resourceUri', input.resourceUri)

  return authFetch(`/ai/mcp-app-resource?${params.toString()}`, {
    method: 'GET',
  }) as Promise<{ html: string }>
}

export async function callMcpAppTool(input: {
  toolName: string
  name: string
  arguments?: Record<string, unknown>
  shopId?: string
  projectId?: string
}): Promise<{
  content: Array<{ type: string; text?: string; [k: string]: unknown }>
  isError?: boolean
  structuredContent?: Record<string, unknown>
  [k: string]: unknown
}> {
  return authFetch('/ai/mcp-app-call-tool', {
    method: 'POST',
    body: JSON.stringify(input),
  }) as Promise<{
    content: Array<{ type: string; text?: string; [k: string]: unknown }>
    isError?: boolean
    structuredContent?: Record<string, unknown>
    [k: string]: unknown
  }>
}
