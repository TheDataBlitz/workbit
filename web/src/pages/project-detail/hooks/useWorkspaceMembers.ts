import { useQuery } from '@tanstack/react-query'
import { fetchWorkspaceMembers } from '../../../api'

export function useWorkspaceMembers(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace', 'members', { workspaceId }],
    enabled: Boolean(workspaceId),
    queryFn: fetchWorkspaceMembers,
  })
}

