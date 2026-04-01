import { Navigate } from 'react-router-dom'
import { getAuthenticatedLandingPath } from '../contexts/workspaceLanding'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuthRequired } from '../pages/auth/AuthContext'

/**
 * Sends signed-in users with a remembered workspace to projects; others to the workspace list.
 * Unsigned users are sent to /workspaces (AuthGate then forwards to login).
 */
export function RootRedirect() {
  const { loading, mustSignIn } = useAuthRequired()
  const { workspaces, workspacesLoading, currentWorkspace } = useWorkspace()

  if (loading || (!mustSignIn && workspacesLoading)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading…
      </div>
    )
  }

  if (mustSignIn) {
    return <Navigate to="/workspaces" replace />
  }

  const to = getAuthenticatedLandingPath(workspaces, currentWorkspace)
  return <Navigate to={to} replace />
}
