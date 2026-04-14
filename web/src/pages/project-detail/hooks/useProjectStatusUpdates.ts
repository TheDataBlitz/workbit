import { useQuery } from '@tanstack/react-query'
import { fetchProjectStatusUpdates } from '../../../api'

export function useProjectStatusUpdates(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'status-updates'],
    enabled: Boolean(projectId),
    queryFn: () => fetchProjectStatusUpdates(projectId!),
  })
}
