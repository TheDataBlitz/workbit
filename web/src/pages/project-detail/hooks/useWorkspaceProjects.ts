import { useQuery } from '@tanstack/react-query'
import { fetchWorkspaceProjects } from '../../../api'
import type { SidebarProject } from '../../../components/Sidebar'

export function useWorkspaceProjects(workspaceId: string | null) {
  const query = useQuery({
    queryKey: ['workspace', 'projects', { workspaceId }],
    enabled: Boolean(workspaceId),
    queryFn: fetchWorkspaceProjects,
  })

  const sidebarProjects: SidebarProject[] = (query.data ?? [])
    .filter((p) => p.workspaceId === workspaceId)
    .map((p) => ({
      id: p.id,
      name: p.name,
      status:
        p.status.toLowerCase() === 'archived'
          ? 'archived'
          : p.status.toLowerCase() === 'in_review'
            ? 'in_review'
            : 'active',
      dimmed: p.status.toLowerCase() === 'archived',
    }))

  return {
    ...query,
    sidebarProjects,
  }
}
