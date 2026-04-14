import { useQuery } from '@tanstack/react-query'
import { fetchProjectProperties } from '../../../api'

export function useProjectProperties(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'properties'],
    enabled: Boolean(projectId),
    queryFn: () => fetchProjectProperties(projectId!),
  })
}
