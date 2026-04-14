import { useQuery } from '@tanstack/react-query'
import { fetchMeAiUsageReport } from '../../../api'

export function useAiUsage(input?: { days?: number; shopId?: string | null }) {
  return useQuery({
    queryKey: ['me', 'ai-usage', input?.days ?? null, input?.shopId ?? null],
    queryFn: () => fetchMeAiUsageReport(input),
  })
}
