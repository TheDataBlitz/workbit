import { useQuery } from '@tanstack/react-query'
import { fetchMeMember } from '../../../api'

export function useMeMember() {
  return useQuery({
    queryKey: ['me', 'member'],
    queryFn: fetchMeMember,
  })
}
