import { useQuery } from '@tanstack/react-query'
import { fetchTeamMembers } from '../../../api'

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['teams', teamId, 'members'],
    enabled: Boolean(teamId),
    queryFn: () => fetchTeamMembers(teamId!),
  })
}
