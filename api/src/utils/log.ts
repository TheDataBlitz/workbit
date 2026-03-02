import { logbit } from '@thedatablitz/logbit-sdk'

/** Logbit project ID to attach to all log events from this app */
export const LOGBIT_PROJECT_ID = 'be4bc17d-3776-4b6c-b1cd-b9a473f10f77'

function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
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
  logbit.error(`[${context}] ${message}`, payload)
}

/**
 * Log API warnings to Logbit.
 */
export function logApiWarn(
  message: string,
  payload?: Record<string, unknown>
): void {
  logbit.warn(message, {
    projectId: LOGBIT_PROJECT_ID,
    title: message,
    ...payload,
  })
}
