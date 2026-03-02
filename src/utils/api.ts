/**
 * API utilities for common patterns and helpers
 */

import type { ApiIssueDetail } from '../api/client'
import { logError } from './errorHandling'

/**
 * Build optimistic update handler
 */
export function createOptimisticUpdate<T extends Record<string, unknown>>(
  setState: React.Dispatch<React.SetStateAction<Record<string, T>>>,
  apiCall: (id: string, update: T) => Promise<unknown>,
  onError?: (error: unknown) => void
) {
  return (id: string, update: T) => {
    // Optimistically update UI
    setState((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...update },
    }))

    // Sync with backend
    apiCall(id, update).catch((error) => {
      // Revert on error
      setState((prev) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _, ...rest } = prev
        return rest
      })
      logError(error, 'OptimisticUpdate')
      if (onError) onError(error)
    })
  }
}

/**
 * Transform issue data for display
 */
export function transformIssueForDisplay(
  issue: ApiIssueDetail,
  overrides?: Record<string, unknown>
) {
  return {
    ...issue,
    assignee: issue.assignee?.name ?? 'Unassigned',
    teamName: issue.team?.name ?? 'Unknown Team',
    projectName: issue.project?.name ?? 'No Project',
    ...overrides,
  }
}

/**
 * Check if data needs refresh (stale data detection)
 */
export function isDataStale(
  lastFetch: number | null,
  staleDuration = 5 * 60 * 1000 // 5 minutes default
): boolean {
  if (!lastFetch) return true
  return Date.now() - lastFetch > staleDuration
}
