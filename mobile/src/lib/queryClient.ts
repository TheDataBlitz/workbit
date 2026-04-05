import { QueryClient } from '@tanstack/react-query';

const DAY_MS = 1000 * 60 * 60 * 24;

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: DAY_MS,
        retry: 2,
      },
    },
  });
}
