import { logbit } from '@thedatablitz/logbit-sdk'

/** Logbit project ID to attach to all log events from this app */
export const LOGBIT_PROJECT_ID = 'be4bc17d-3776-4b6c-b1cd-b9a473f10f77'

/**
 * Error handling utilities for API calls and general error management
 */

/**
 * Extract a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unexpected error occurred'
}

/**
 * Log error via Logbit (batched and sent to ingest API)
 */
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)
  const payload: Record<string, unknown> = {
    projectId: LOGBIT_PROJECT_ID,
    title: context ? `[${context}] ${message}` : message,
    context: context ?? 'app',
    errorMessage: message,
  }
  if (error instanceof Error && error.stack) {
    payload.stack = error.stack
  } else if (error && typeof error === 'object') {
    payload.raw = error
  }
  logbit.error(context ? `[${context}] ${message}` : message, payload)
}

/**
 * Handle async errors with optional callback
 */
export async function handleAsync<T>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    if (onError) {
      onError(error)
    } else {
      logError(error)
    }
    return null
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      logbit.warn('Retry attempt failed', {
        projectId: LOGBIT_PROJECT_ID,
        title: 'Retry attempt failed',
        attempt: i + 1,
        maxRetries,
        error: getErrorMessage(error),
      })
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}
