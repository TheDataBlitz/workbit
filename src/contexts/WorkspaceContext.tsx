import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  workspaceMembersQueryKey,
  workspaceMembersQueryKeyRoot,
  workspaceTeamsAndProjectsQueryKey,
  workspacesListQueryKeyPrefix,
} from './workspaceQueryKeys'
import { WORKSPACE_ID_STORAGE_KEY } from './workspaceLanding'

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
  const queryClient = useQueryClient()
  const { state: authState } = useAuth()
  const isAuthLoading = authState.status === 'loading'
  const userId =
    authState.status === 'authenticated' ? authState.session.user.id : null

  const [currentWorkspace, setCurrentWorkspaceState] =
    useState<ApiWorkspace | null>(null)

  const setCurrentWorkspace = useCallback((ws: ApiWorkspace | null) => {
    setCurrentWorkspaceState(ws)
    if (ws) {
      try {
        localStorage.setItem(WORKSPACE_ID_STORAGE_KEY, ws.id)
      } catch {
        // ignore
      }
    } else {
      try {
        localStorage.removeItem(WORKSPACE_ID_STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [])

  const membersQuery = useQuery({
    queryKey: workspaceMembersQueryKey(userId),
    queryFn: async () => {
      try {
        return await fetchMembers()
      } catch (e) {
        logError(e, 'WorkspaceContext.resolveMember')
        throw e
      }
    },
    enabled: !isAuthLoading && !!userId,
  })

  const currentMember = useMemo(() => {
    if (!membersQuery.data || !userId) return undefined
    return membersQuery.data.find((m) => m.uid && m.uid === userId)
  }, [membersQuery.data, userId])

  const memberId = currentMember?.id ?? null

  const workspacesQuery = useQuery({
    queryKey: [...workspacesListQueryKeyPrefix, memberId],
    queryFn: async ({ queryKey }) => {
      const id = queryKey[2]
      if (typeof id !== 'string') {
        throw new Error('Missing workspace member id.')
      }
      try {
        return await fetchWorkspaces(id)
      } catch (e) {
        logError(e, 'WorkspaceContext.loadWorkspaces')
        throw e
      }
    },
    enabled: typeof memberId === 'string' && memberId.length > 0,
  })

  const workspaces = useMemo(
    () => (!userId || !memberId ? [] : (workspacesQuery.data ?? [])),
    [userId, memberId, workspacesQuery.data]
  )

  const workspacesLoading =
    isAuthLoading ||
    (!!userId &&
      (membersQuery.isPending ||
        membersQuery.isFetching ||
        (!!memberId &&
          (workspacesQuery.isPending || workspacesQuery.isFetching))))

  const workspacesError = membersQuery.isError
    ? membersQuery.error instanceof Error
      ? membersQuery.error.message
      : 'Failed to load workspaces.'
    : workspacesQuery.isError
      ? workspacesQuery.error instanceof Error
        ? workspacesQuery.error.message
        : 'Failed to load workspaces.'
      : null

  useEffect(() => {
    const list = workspacesQuery.data
    if (!list?.length) return
    try {
      const storedId = localStorage.getItem(WORKSPACE_ID_STORAGE_KEY)
      if (!storedId) return
      const found = list.find((w) => w.id === storedId)
      if (found) setCurrentWorkspaceState(found)
    } catch {
      // ignore
    }
  }, [workspacesQuery.data])

  const refreshWorkspaces = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: workspaceMembersQueryKeyRoot,
    })
    await queryClient.invalidateQueries({
      queryKey: workspacesListQueryKeyPrefix,
    })
  }, [queryClient])

  const workspaceId = currentWorkspace?.id

  const teamsProjectsQuery = useQuery({
    queryKey: workspaceTeamsAndProjectsQueryKey(workspaceId ?? ''),
    queryFn: async () => {
      const id = workspaceId!
      try {
        const [teamsRes, projectsRes] = await Promise.all([
          fetchWorkspaceTeams(id),
          fetchProjects(),
        ])
        return {
          teams: teamsRes.map((t) => ({ id: t.id, name: t.name })) as Team[],
          projects: projectsRes as WorkspaceProject[],
        }
      } catch (e) {
        logError(e, 'WorkspaceContext.loadTeamsAndProjects')
        return { teams: [] as Team[], projects: [] as WorkspaceProject[] }
      }
    },
    enabled: typeof workspaceId === 'string' && workspaceId.length > 0,
  })

  const teams = useMemo(
    () => teamsProjectsQuery.data?.teams ?? [],
    [teamsProjectsQuery.data]
  )
  const projects = useMemo(
    () => teamsProjectsQuery.data?.projects ?? [],
    [teamsProjectsQuery.data]
  )
  const teamsLoading = Boolean(
    workspaceId &&
    (teamsProjectsQuery.isPending || teamsProjectsQuery.isFetching)
  )
  const projectsLoading = teamsLoading

  const refreshTeamsAndProjects = useCallback(async () => {
    if (!workspaceId) return
    await queryClient.invalidateQueries({
      queryKey: workspaceTeamsAndProjectsQueryKey(workspaceId),
    })
  }, [queryClient, workspaceId])

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      currentWorkspace,
      setCurrentWorkspace,
      workspaces,
      workspacesLoading,
      workspacesError,
      refreshWorkspaces,
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
      refreshWorkspaces,
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
