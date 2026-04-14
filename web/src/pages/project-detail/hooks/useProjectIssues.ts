import { useQuery } from '@tanstack/react-query'
import { fetchProjectIssues } from '../../../api'

export function useProjectIssues(
  projectId: string | undefined,
  filter: 'all' | 'active' | 'backlog' = 'all'
) {
  return useQuery({
    queryKey: ['projects', projectId, 'issues', { filter }],
    enabled: Boolean(projectId),
    queryFn: () => fetchProjectIssues(projectId!, filter),
  })
}
