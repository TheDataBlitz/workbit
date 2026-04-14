import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMeMember, fetchWorkspaces } from '../../../api'
import type { WorkspaceListRow } from '../workspaceListData'

function protocolFromName(name: string): WorkspaceListRow['protocol'] {
  const n = name.toLowerCase()
  if (n.includes('alpha')) return 'ALPHA'
  if (n.includes('delta')) return 'DELTA'
  if (n.includes('epsilon')) return 'EPSILON'
  if (n.includes('omega')) return 'OMEGA'
  return 'ALPHA'
}

export function useWorkspaceList() {
  const me = useQuery({
    queryKey: ['me', 'member'],
    queryFn: fetchMeMember,
  })

  const workspaces = useQuery({
    queryKey: ['workspaces', { memberId: me.data?.id ?? null }],
    enabled: Boolean(me.data?.id),
    queryFn: () => fetchWorkspaces(me.data!.id),
  })

  const rows: WorkspaceListRow[] = useMemo(() => {
    const list = workspaces.data ?? []
    return list.map((w, i) => ({
      ...w,
      description: 'Workspace environment',
      protocol: protocolFromName(w.name),
      visualState: i === 0 ? 'active' : 'default',
      tags:
        i === 0
          ? [
              { label: 'Active', tone: 'primary' },
              { label: w.region, tone: 'muted' },
            ]
          : [{ label: w.region, tone: 'muted' }],
    }))
  }, [workspaces.data])

  return {
    me,
    workspaces,
    rows,
    isLoading: me.isLoading || workspaces.isLoading,
    error: me.error ?? workspaces.error,
    refetch: () => {
      me.refetch()
      workspaces.refetch()
    },
  }
}
