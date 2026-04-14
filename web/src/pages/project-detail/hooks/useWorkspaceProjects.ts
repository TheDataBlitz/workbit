import { useQuery } from '@tanstack/react-query'
import { fetchWorkspaceTeams } from '../../../api'
import type { SidebarProject } from '../../../components/Sidebar'

export function useWorkspaceProjects(workspaceId: string | null) {
  const query = useQuery({
    queryKey: ['workspace', 'teams', { workspaceId }],
    enabled: Boolean(workspaceId),
    queryFn: () => fetchWorkspaceTeams({ workspaceId: workspaceId! }),
  })

  const sidebarProjects: SidebarProject[] = (query.data ?? [])
    .filter((t) => t.project)
    .map((t) => ({
      id: t.project!.id,
      name: t.project!.name,
      status: 'active',
    }))

  return {
    ...query,
    sidebarProjects,
  }
}
