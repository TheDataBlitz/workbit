import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMeMember, fetchWorkspaces } from '../../../api'
import type { SidebarWorkspace } from '../../../components/Sidebar'

const LS_SELECTED_WORKSPACE = 'workbit.selected_workspace_id'

function safeGetSelectedWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(LS_SELECTED_WORKSPACE)
  return v && v.trim() ? v : null
}

function safeSetSelectedWorkspaceId(id: string | null) {
  if (typeof window === 'undefined') return
  if (!id) {
    window.localStorage.removeItem(LS_SELECTED_WORKSPACE)
    return
  }
  window.localStorage.setItem(LS_SELECTED_WORKSPACE, id)
}

export function useSidebarWorkspaces() {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    () => safeGetSelectedWorkspaceId()
  )

  const me = useQuery({
    queryKey: ['me', 'member'],
    queryFn: fetchMeMember,
  })

  const workspaces = useQuery({
    queryKey: ['workspaces', { memberId: me.data?.id ?? null }],
    enabled: Boolean(me.data?.id),
    queryFn: () => fetchWorkspaces(me.data!.id),
  })

  const sidebarWorkspaces: SidebarWorkspace[] = useMemo(
    () =>
      (workspaces.data ?? []).map((w) => ({
        id: w.id,
        name: w.name,
      })),
    [workspaces.data]
  )

  const effectiveSelectedWorkspaceId = useMemo(() => {
    if (sidebarWorkspaces.length === 0) return selectedWorkspaceId
    if (
      selectedWorkspaceId &&
      sidebarWorkspaces.some((w) => w.id === selectedWorkspaceId)
    ) {
      return selectedWorkspaceId
    }
    return sidebarWorkspaces[0]!.id
  }, [sidebarWorkspaces, selectedWorkspaceId])

  const setSelectedWorkspaceIdAndPersist = (id: string | null) => {
    setSelectedWorkspaceId(id)
    safeSetSelectedWorkspaceId(id)
  }

  return {
    me,
    workspaces,
    sidebarWorkspaces,
    selectedWorkspaceId: effectiveSelectedWorkspaceId,
    setSelectedWorkspaceId: setSelectedWorkspaceIdAndPersist,
  }
}
