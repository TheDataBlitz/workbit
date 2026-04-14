import { logbit } from '@thedatablitz/logbit-sdk'

/** Logbit project ID to attach to all log events from this app */
export const LOGBIT_PROJECT_ID = 'be4bc17d-3776-4b6c-b1cd-b9a473f10f77'

function safeLogbit(
  level: 'error' | 'warn',
  message: string,
  payload: Record<string, unknown>
): void {
  try {
    if (level === 'error') logbit.error(message, payload)
    else logbit.warn(message, payload)
  } catch (e) {
    // Logbit transport failures must never crash request handlers.
    // Fall back to stderr so we still have local visibility.
    const fallbackMeta = {
      logbitFailed: true,
      originalMessage: message,
      payload,
      error:
        e instanceof Error
          ? { message: e.message, stack: e.stack }
          : { message: String(e) },
    }
    console.error('[logbit] failed to send log event', fallbackMeta)
  }
}

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message
  }
  return 'Unknown error'
}

/**
 * Log API errors to Logbit with optional request context.
 */
export function logApiError(
  err: unknown,
  context: string,
  meta?: Record<string, unknown>
): void {
  const message = getMessage(err)
  const payload: Record<string, unknown> = {
    projectId: LOGBIT_PROJECT_ID,
    title: `[${context}] ${message}`,
    context,
    error: message,
    ...meta,
  }
  if (err instanceof Error && err.stack) payload.stack = err.stack
  safeLogbit('error', `[${context}] ${message}`, payload)
}

/**
 * Log API warnings to Logbit.
 */
export function logApiWarn(
  message: string,
  payload?: Record<string, unknown>
): void {
  safeLogbit('warn', message, {
    projectId: LOGBIT_PROJECT_ID,
    title: message,
    ...payload,
  })
}
