import { logApiWarn } from '../utils/log.js'
import {
  runNimChatCompletion,
  type NvidiaChatRequestMessage,
  type NvidiaToolCall,
  type NvidiaUsageTotals,
} from './nvidia-client.js'
import {
  runOllamaChatCompletion,
  streamOllamaChatCompletionText,
} from './ollama-client.js'

export type ChatRequestMessage = NvidiaChatRequestMessage
export type ChatToolCall = NvidiaToolCall
export type ChatUsageTotals = NvidiaUsageTotals

export type AiProvider = 'nvidia' | 'ollama'

export class AiNotConfiguredError extends Error {
  override name = 'AiNotConfiguredError'
  constructor(message = 'AI is not configured.') {
    super(message)
  }
}

function aiProviderFromEnv(): AiProvider {
  // const raw = (process.env.AI_PROVIDER ?? 'nvidia').trim().toLowerCase();
  const raw = 'ollama'
  if (raw === 'ollama' || raw === 'nvidia') return raw
  logApiWarn('ai.unknown_provider_fallback', { provider: raw })
  return 'nvidia'
}

function providerModelName(provider: AiProvider): string {
  if (provider === 'ollama') return process.env.OLLAMA_CHAT_MODEL ?? ''
  return process.env.NVIDIA_CHAT_MODEL ?? 'nvidia/nemotron-3-super-120b-a12b'
}

export function aiProviderInfo(): { provider: AiProvider; model: string } {
  const provider = aiProviderFromEnv()
  return { provider, model: providerModelName(provider) }
}

/**
 * Provider-switched chat completion.
 * - `AI_PROVIDER=ollama` uses Ollama's OpenAI-compatible `/v1/chat/completions`
 * - `AI_PROVIDER=nvidia` (default) uses NVIDIA NIM
 */
export async function runChatCompletion(input: {
  messages: ChatRequestMessage[]
  tools?: unknown[]
  tool_choice?:
    | 'auto'
    | 'none'
    | { type: 'function'; function: { name: string } }
}): Promise<{
  content: string | null | undefined
  tool_calls?: ChatToolCall[]
  usage: ChatUsageTotals
}> {
  const provider = aiProviderFromEnv();
  console.log('provider', provider)
  try {
    if (provider === 'ollama') {
      const res = await runOllamaChatCompletion({
        messages: input.messages as unknown as Parameters<
          typeof runOllamaChatCompletion
        >[0]['messages'],
        tools: input.tools,
        tool_choice: input.tool_choice,
      })
      return {
        content: res.content,
        tool_calls: res.tool_calls as unknown as ChatToolCall[] | undefined,
        usage: res.usage,
      }
    }

    return await runNimChatCompletion(input)
  } catch (e) {
    if (
      e &&
      typeof e === 'object' &&
      'name' in e &&
      (e as { name?: unknown }).name === 'AiNotConfiguredError'
    ) {
      const msg =
        e instanceof Error
          ? e.message
          : 'AI is not configured for this provider.'
      throw new AiNotConfiguredError(msg)
    }
    throw e
  }
}

export type ChatCompletionTextStreamEvent =
  | { type: 'delta'; contentDelta: string }
  | { type: 'done'; usage: ChatUsageTotals }

/**
 * Stream-only helper for "plain text" completions.
 * Current limitations:
 * - Only supported for Ollama provider
 * - Does not support tool calls / tool streaming
 */
export async function* streamChatCompletionText(input: {
  messages: ChatRequestMessage[]
}): AsyncGenerator<ChatCompletionTextStreamEvent, void, void> {
  const provider = aiProviderFromEnv()
  if (provider !== 'ollama') {
    throw new Error('Streaming is only supported for Ollama provider right now.')
  }

  for await (const ev of streamOllamaChatCompletionText({
    messages: input.messages as unknown as Parameters<
      typeof streamOllamaChatCompletionText
    >[0]['messages'],
  })) {
    if (ev.type === 'delta') {
      yield { type: 'delta', contentDelta: ev.contentDelta }
    } else {
      yield { type: 'done', usage: ev.usage }
    }
  }
}
