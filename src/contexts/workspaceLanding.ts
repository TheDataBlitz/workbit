import type { ApiWorkspace } from '../api/client'

export const WORKSPACE_ID_STORAGE_KEY = 'workbit.currentWorkspaceId'

/**
 * After sign-in, when workspace list is not loaded yet: trust persisted id.
 * Invalid ids are handled by MainLayout (redirect to workspace list).
 */
export function getStoredWorkspaceInboxPath(): string {
  try {
    const id = localStorage.getItem(WORKSPACE_ID_STORAGE_KEY)
    if (id) return `/workspace/${id}/inbox`
  } catch {
    // ignore
  }
  return '/workspaces'
}

/** When workspaces are loaded: prefer context, then validate persisted id. */
export function getAuthenticatedLandingPath(
  workspaces: ApiWorkspace[],
  currentWorkspace: ApiWorkspace | null
): string {
  if (currentWorkspace?.id) {
    return `/workspace/${currentWorkspace.id}/inbox`
  }
  try {
    const stored = localStorage.getItem(WORKSPACE_ID_STORAGE_KEY)
    if (stored && workspaces.some((w) => w.id === stored)) {
      return `/workspace/${stored}/inbox`
    }
  } catch {
    // ignore
  }
  return '/workspaces'
}
