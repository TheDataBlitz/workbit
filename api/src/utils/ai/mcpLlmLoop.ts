import type { Client } from '@modelcontextprotocol/sdk/client/index.js'
import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js'
import { withMcpClient } from '../mcpClient.js'
import type { WorkbitUpstreamAuth } from '../../middleware/auth.js'
import {
  coerceAssistantContentBesideToolCalls,
  nvidiaOpenAiChatCompletion,
} from './nvedia.js'

export type AssistantToolCall = {
  id: string
  function: { name: string; arguments: string }
}

export type McpLlmLoopResult = {
  text: string
  finishedReason: 'max_rounds' | 'model_done' | 'empty_reply' | 'no_message'
}

export type RunMcpLlmLoopOptions = {
  auth: WorkbitUpstreamAuth
  systemPrompt: string
  initialUserMessage: string
  /** If set, only these MCP tool names are exposed to the model. Empty array = no tools. */
  toolNameAllowlist?: string[]
  maxRounds?: number
  enableChatNudges?: boolean
  /** Used with enableChatNudges for looksLikeWorkspaceDataRequest */
  nudgeUserMessageContext?: string
}

async function listAllTools(client: Client): Promise<Tool[]> {
  const all: Tool[] = []
  let cursor: string | undefined
  do {
    const page = await client.listTools(cursor ? { cursor } : undefined)
    all.push(...(page.tools as Tool[]))
    cursor = page.nextCursor
  } while (cursor)
  return all
}

function openAiParametersFromMcpInputSchema(
  inputSchema: Tool['inputSchema']
): Record<string, unknown> {
  if (
    inputSchema &&
    typeof inputSchema === 'object' &&
    !Array.isArray(inputSchema)
  ) {
    const s = inputSchema as Record<string, unknown>
    if (s.type === 'object') {
      return s
    }
    if ('properties' in s || 'required' in s || 'additionalProperties' in s) {
      return { type: 'object', ...s }
    }
  }
  return { type: 'object', properties: {} }
}

function mcpToolToOpenAi(t: Tool) {
  return {
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description?.trim() || `Workbit tool: ${t.name}`,
      parameters: openAiParametersFromMcpInputSchema(t.inputSchema),
    },
  }
}

function dropRedundantGetProjectWithIssues(
  toolCalls: AssistantToolCall[]
): AssistantToolCall[] {
  if (toolCalls.length < 2) {
    return toolCalls
  }
  const issuesCall = toolCalls.find(
    (c) => c.function.name === 'getIssuesByProject'
  )
  if (!issuesCall) {
    return toolCalls
  }
  let issuesProjectId: string | undefined
  try {
    const j = JSON.parse(issuesCall.function.arguments?.trim() || '{}') as {
      projectId?: string
    }
    issuesProjectId = typeof j.projectId === 'string' ? j.projectId : undefined
  } catch {
    return toolCalls
  }
  if (!issuesProjectId) {
    return toolCalls
  }
  return toolCalls.filter((c) => {
    if (c.function.name !== 'getProject') {
      return true
    }
    try {
      const j = JSON.parse(c.function.arguments?.trim() || '{}') as {
        projectId?: string
      }
      return j.projectId !== issuesProjectId
    } catch {
      return true
    }
  })
}

function stringifyToolResult(result: CallToolResult): string {
  if (result.isError) {
    return `Error: ${JSON.stringify(result.content)}`
  }
  const blocks = result.content ?? []
  return blocks
    .map((b) =>
      b.type === 'text' && 'text' in b
        ? String((b as { text: string }).text)
        : JSON.stringify(b)
    )
    .join('\n')
}

export function parseToolArgs(
  argsRaw: string | undefined
): Record<string, unknown> {
  if (!argsRaw?.trim()) {
    return {}
  }
  try {
    return JSON.parse(argsRaw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function isPlaceholderLike(value: string): boolean {
  const v = value.trim().toLowerCase()
  return (
    v === 'issueid' ||
    v === 'projectid' ||
    v === 'teamid' ||
    v === 'title' ||
    v === 'description based on title' ||
    /^issue[_\s-]?id$/.test(v)
  )
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

const WORKSPACE_ENTITY =
  /\b(projects?|issues?|decisions?|teams?|workspace|workbit)\b/

function looksLikeWorkspaceDataRequest(message: string): boolean {
  const m = message.toLowerCase()
  if (
    /\b(list|show|display|fetch|get|see|open)\b/.test(m) &&
    WORKSPACE_ENTITY.test(m)
  ) {
    return true
  }
  if (
    /\bwhat('?s| is| are)\b/.test(m) &&
    WORKSPACE_ENTITY.test(m) &&
    /\b(my|our|all|the|in my|in our|in workbit|in (the )?workspace|assigned|open|do i|i have)\b/.test(
      m
    )
  ) {
    return true
  }
  if (/\b(my|our) (projects|issues|teams|decisions)\b/.test(m)) {
    return true
  }
  if (/\ball projects\b/.test(m) || /\bhow many projects\b/.test(m)) {
    return true
  }
  return false
}

function looksLikeMetaOnlyAnswer(text: string): boolean {
  if (text.length > 400) return false
  const t = text.toLowerCase()
  if (/\bthis response\b/.test(t)) return true
  if (/\blists all (the )?/.test(t) && text.length < 220) return true
  return false
}

function messagesHadToolResults(messages: unknown[]): boolean {
  return messages.some(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      (entry as { role?: string }).role === 'tool'
  )
}

function filterToolsByAllowlist(
  mcpTools: Tool[],
  allowlist: string[] | undefined
): Tool[] {
  if (allowlist === undefined) {
    return mcpTools
  }
  const set = new Set(allowlist)
  return mcpTools.filter((t) => set.has(t.name))
}

/**
 * Shared MCP + NVIDIA chat completion loop (one tool execution per assistant turn).
 */
export async function runMcpLlmLoop(
  options: RunMcpLlmLoopOptions
): Promise<McpLlmLoopResult> {
  const {
    auth,
    systemPrompt,
    initialUserMessage,
    toolNameAllowlist,
    maxRounds = 100,
    enableChatNudges = false,
    nudgeUserMessageContext = initialUserMessage,
  } = options

  return withMcpClient(auth, async (client) => {
    const mcpTools = await listAllTools(client)
    const filtered = filterToolsByAllowlist(mcpTools, toolNameAllowlist)
    const openAiTools = filtered.map(mcpToolToOpenAi)

    const messages: unknown[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: initialUserMessage },
    ]

    let nudgedForMissingTools = false
    let nudgedPostToolMeta = false

    for (let round = 0; round < maxRounds; round++) {
      const completion = await nvidiaOpenAiChatCompletion({
        messages,
        tools: openAiTools.length > 0 ? openAiTools : undefined,
      })

      const msg = completion.choices?.[0]?.message
      if (!msg) {
        return {
          text: 'The model returned no message.',
          finishedReason: 'no_message',
        }
      }

      const toolCallsRaw = msg.tool_calls
      if (toolCallsRaw && toolCallsRaw.length > 0) {
        const toolCalls = dropRedundantGetProjectWithIssues(
          toolCallsRaw as AssistantToolCall[]
        )
        const toolCallsToExecute = toolCalls.slice(0, 1)
        messages.push({
          role: 'assistant',
          content: coerceAssistantContentBesideToolCalls(msg.content ?? ''),
          tool_calls: toolCallsToExecute,
        })

        for (const call of toolCallsToExecute) {
          const name = call.function.name
          const args = parseToolArgs(call.function.arguments)

          if (
            name === 'updateIssue' &&
            typeof args.issueId === 'string' &&
            isPlaceholderLike(args.issueId)
          ) {
            messages.push({
              role: 'tool',
              tool_call_id: call.id,
              content:
                'Invalid updateIssue call: "issueId" is a placeholder. First fetch real issue IDs, then call updateIssue with one real issue id.',
            })
            continue
          }

          if (
            (name === 'createIssue' || name === 'createSubIssue') &&
            !hasNonEmptyString(args.description)
          ) {
            messages.push({
              role: 'tool',
              tool_call_id: call.id,
              content:
                `Invalid ${name} call: "description" is required and must be non-empty. ` +
                'Provide a concrete description of the task, expected outcome, and key acceptance criteria.',
            })
            continue
          }

          const raw = await client.callTool({ name, arguments: args })
          const result = raw as CallToolResult
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: stringifyToolResult(result),
          })
        }
        continue
      }

      const hadToolResults = messagesHadToolResults(messages)
      const text = msg.content?.trim()

      if (
        enableChatNudges &&
        openAiTools.length > 0 &&
        !hadToolResults &&
        !nudgedForMissingTools &&
        looksLikeWorkspaceDataRequest(nudgeUserMessageContext)
      ) {
        nudgedForMissingTools = true
        messages.push({
          role: 'user',
          content:
            'Call the relevant Workbit tool(s) in this turn to load real data. Then answer with the actual names, IDs, and fields from the tool results - not a description of what the answer would say.',
        })
        continue
      }

      if (
        enableChatNudges &&
        text &&
        hadToolResults &&
        !nudgedPostToolMeta &&
        looksLikeMetaOnlyAnswer(text)
      ) {
        nudgedPostToolMeta = true
        messages.push({
          role: 'user',
          content:
            'Use the JSON or text from the tool messages above. List each project (or other item) with its real name and id from that data. Do not use generic phrases about "this response" or "lists all".',
        })
        continue
      }

      if (text) {
        return { text, finishedReason: 'model_done' }
      }
      return {
        text: 'The model returned an empty reply.',
        finishedReason: 'empty_reply',
      }
    }

    return {
      text: 'Stopped after too many tool-calling rounds. Try a simpler question.',
      finishedReason: 'max_rounds',
    }
  })
}
