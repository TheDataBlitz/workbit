import { useQuery } from '@tanstack/react-query'
import { fetchProjectDecisions } from '../../../api'

export function useProjectDecisions(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId, 'decisions'],
    enabled: Boolean(projectId),
    queryFn: () => fetchProjectDecisions(projectId!),
  })
}
