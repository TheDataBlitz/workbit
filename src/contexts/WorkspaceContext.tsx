import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchMembers,
  fetchWorkspaces,
  fetchWorkspaceTeams,
  fetchProjects,
} from '../api/client'
import type { ApiWorkspace } from '../api/client'
import type { Team } from '../constants'
import { useAuth } from '../pages/auth/AuthContext'
import { logError } from '../utils/errorHandling'

const STORAGE_KEY = 'workbit.currentWorkspaceId'

export type WorkspaceProject = {
  id: string
  name: string
  team: { id: string; name: string }
  status: string
}

type WorkspaceContextValue = {
  currentWorkspace: ApiWorkspace | null
  setCurrentWorkspace: (ws: ApiWorkspace | null) => void
  workspaces: ApiWorkspace[]
  workspacesLoading: boolean
  workspacesError: string | null
  refreshWorkspaces: () => Promise<void>
  teams: Team[]
  projects: WorkspaceProject[]
  teamsLoading: boolean
  projectsLoading: boolean
  refreshTeamsAndProjects: () => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth()
  const userId =
    authState.status === 'authenticated' ? authState.session.user.id : null

  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<ApiWorkspace | null>(null)
  const [workspaces, setWorkspaces] = useState<ApiWorkspace[]>([])
  const [workspacesLoading, setWorkspacesLoading] = useState(true)
  const [workspacesError, setWorkspacesError] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<WorkspaceProject[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)
  const [projectsLoading, setProjectsLoading] = useState(false)

  const setCurrentWorkspace = useCallback((ws: ApiWorkspace | null) => {
    setCurrentWorkspaceState(ws)
    if (ws) {
      try {
        localStorage.setItem(STORAGE_KEY, ws.id)
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  const loadWorkspaces = useCallback(async () => {
    if (!userId) {
      setWorkspaces([])
      setWorkspacesLoading(false)
      return
    }
    setWorkspacesLoading(true)
    setWorkspacesError(null)
    try {
      const members = await fetchMembers()
      const member = members.find((m) => m.uid && m.uid === userId)
      if (!member) {
        setWorkspaces([])
        return
      }
      const list = await fetchWorkspaces(member.id)
      setWorkspaces(list)
      const storedId = localStorage.getItem(STORAGE_KEY)
      if (storedId) {
        const found = list.find((w) => w.id === storedId)
        if (found) setCurrentWorkspaceState(found)
      }
    } catch (e) {
      logError(e, 'WorkspaceContext.loadWorkspaces')
      setWorkspacesError(
        e instanceof Error ? e.message : 'Failed to load workspaces'
      )
      setWorkspaces([])
    } finally {
      setWorkspacesLoading(false)
    }
  }, [userId])

  useEffect(() => {
    let cancelled = false
    if (!userId) {
      setWorkspaces([])
      setWorkspacesLoading(false)
      return
    }
    void (async () => {
      setWorkspacesLoading(true)
      setWorkspacesError(null)
      try {
        const members = await fetchMembers()
        if (cancelled) return
        const member = members.find((m) => m.uid && m.uid === userId)
        if (!member) {
          if (!cancelled) setWorkspaces([])
          return
        }
        const list = await fetchWorkspaces(member.id)
        if (cancelled) return
        setWorkspaces(list)
        const storedId = localStorage.getItem(STORAGE_KEY)
        if (storedId) {
          const found = list.find((w) => w.id === storedId)
          if (found) setCurrentWorkspaceState(found)
        }
      } catch (e) {
        if (!cancelled) logError(e, 'WorkspaceContext.loadWorkspaces')
        if (!cancelled)
          setWorkspacesError(
            e instanceof Error ? e.message : 'Failed to load workspaces'
          )
        if (!cancelled) setWorkspaces([])
      } finally {
        if (!cancelled) setWorkspacesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const loadTeamsAndProjects = useCallback(async () => {
    if (!currentWorkspace) return
    setTeamsLoading(true)
    setProjectsLoading(true)
    try {
      // Load all workspace teams (no memberId filter) for navbar dropdown and sidebar
      const [teamsRes, projectsRes] = await Promise.all([
        fetchWorkspaceTeams(currentWorkspace.id),
        fetchProjects(),
      ])
      setTeams(teamsRes.map((t) => ({ id: t.id, name: t.name })))
      setProjects(projectsRes)
    } catch {
      setTeams([])
      setProjects([])
    } finally {
      setTeamsLoading(false)
      setProjectsLoading(false)
    }
  }, [currentWorkspace])

  const refreshTeamsAndProjects = useCallback(async () => {
    await loadTeamsAndProjects()
  }, [loadTeamsAndProjects])

  useEffect(() => {
    if (!currentWorkspace) {
      setTeams([])
      setProjects([])
      setTeamsLoading(false)
      setProjectsLoading(false)
      return
    }
    let cancelled = false
    setTeamsLoading(true)
    setProjectsLoading(true)
    void (async () => {
      try {
        // Load all workspace teams (no memberId filter) for navbar dropdown and sidebar
        const [teamsRes, projectsRes] = await Promise.all([
          fetchWorkspaceTeams(currentWorkspace.id),
          fetchProjects(),
        ])
        if (cancelled) return
        setTeams(teamsRes.map((t) => ({ id: t.id, name: t.name })))
        setProjects(projectsRes)
      } catch {
        if (!cancelled) {
          setTeams([])
          setProjects([])
        }
      } finally {
        if (!cancelled) {
          setTeamsLoading(false)
          setProjectsLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentWorkspace])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      currentWorkspace,
      setCurrentWorkspace,
      workspaces,
      workspacesLoading,
      workspacesError,
      refreshWorkspaces: loadWorkspaces,
      teams,
      projects,
      teamsLoading,
      projectsLoading,
      refreshTeamsAndProjects,
    }),
    [
      currentWorkspace,
      setCurrentWorkspace,
      workspaces,
      workspacesLoading,
      workspacesError,
      loadWorkspaces,
      teams,
      projects,
      teamsLoading,
      projectsLoading,
      refreshTeamsAndProjects,
    ]
  )

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is the public API for this context
export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx)
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
