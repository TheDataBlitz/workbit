import { useQuery } from '@tanstack/react-query'
import { fetchProjectAiUsage } from '../../../api'

export function useProjectAiUsage(projectId: string | undefined, days = 30) {
  return useQuery({
    queryKey: ['projects', projectId, 'ai-usage', days],
    enabled: Boolean(projectId),
    queryFn: () => fetchProjectAiUsage({ projectId: projectId!, days }),
  })
}

