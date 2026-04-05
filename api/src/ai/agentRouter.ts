import { runNimChatCompletion } from './nvidia-client.js'
import type { AgentCatalogEntry } from '../models/agentCatalog.js'

const ROUTER_SYSTEM = `You are a routing assistant. Your only job is to pick which specialist agent should answer the user's message.

You MUST respond with a single JSON object and no other text, in this exact shape:
{"agent_key":"<key>"}

Where <key> is exactly one of the agent_key values listed in the user message. Pick the best match based on the user's question. If none fit clearly, pick the first agent_key listed.`

function parseAgentKeyFromRouterContent(raw: string): string | null {
  const trimmed = raw.trim()
  const tryParse = (s: string): string | null => {
    try {
      const v = JSON.parse(s) as unknown
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const key = (v as { agent_key?: unknown }).agent_key
        if (typeof key === 'string' && key.trim()) return key.trim()
      }
    } catch {
      /* try next */
    }
    return null
  }

  let key = tryParse(trimmed)
  if (key) return key

  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) {
    key = tryParse(trimmed.slice(start, end + 1))
  }
  return key
}

function fallbackKey(enabledKeys: string[]): string {
  const sorted = [...enabledKeys].sort()
  return sorted[0] ?? 'general'
}

/**
 * Uses one NIM completion (no tools) to pick an agent_key from the enabled set.
 * On parse failure or invalid key, returns alphabetically first enabled key.
 */
export async function routeToAgentKey(input: {
  enabledAgents: AgentCatalogEntry[]
  lastUserMessage: string
  projectName?: string
}): Promise<{ agentKey: string; usedFallback: boolean }> {
  const { enabledAgents, lastUserMessage, projectName } = input
  const allowed = new Set(enabledAgents.map((a) => a.key))
  if (allowed.size === 0) {
    return { agentKey: 'general', usedFallback: true }
  }
  if (enabledAgents.length === 1) {
    return { agentKey: enabledAgents[0].key, usedFallback: false }
  }

  const lines = enabledAgents.map(
    (a) =>
      `- agent_key: ${a.key}\n  title: ${a.title}\n  description: ${a.description}`
  )
  const header = projectName
    ? `Project name: ${projectName}\n\nAvailable agents (pick exactly one agent_key):\n`
    : `Available agents (pick exactly one agent_key):\n`
  const userBlock = `${header}${lines.join('\n')}\n\nUser message:\n${lastUserMessage}`

  const { content } = await runNimChatCompletion({
    messages: [
      { role: 'system', content: ROUTER_SYSTEM },
      { role: 'user', content: userBlock },
    ],
  })

  const text = typeof content === 'string' ? content : ''
  const parsed = parseAgentKeyFromRouterContent(text)
  if (parsed && allowed.has(parsed)) {
    return { agentKey: parsed, usedFallback: false }
  }

  const fb = fallbackKey([...allowed])
  return { agentKey: fb, usedFallback: true }
}
