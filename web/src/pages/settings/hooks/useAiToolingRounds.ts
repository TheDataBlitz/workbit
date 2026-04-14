import { useQuery } from '@tanstack/react-query'
import { fetchAiToolingRoundsReport } from '../../../api/usage'

export function useAiToolingRounds(input?: {
  days?: number
  shopId?: string | null
}) {
  return useQuery({
    queryKey: [
      'usage',
      'ai-tooling-rounds',
      input?.days ?? null,
      input?.shopId ?? null,
    ],
    queryFn: () => fetchAiToolingRoundsReport(input),
  })
}
