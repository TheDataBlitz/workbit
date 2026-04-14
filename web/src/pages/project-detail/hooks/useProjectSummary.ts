import { useQuery } from '@tanstack/react-query'
import { fetchProject } from '../../../api'

export function useProjectSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: ['projects', projectId],
    enabled: Boolean(projectId),
    queryFn: () => fetchProject(projectId!),
  })
}
