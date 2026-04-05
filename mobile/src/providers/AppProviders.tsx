import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { createAppQueryClient } from '../lib/queryClient';
import { createQueryCachePersister } from '../lib/queryPersister';
import { AuthProvider } from '../pages/auth';

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;
const CACHE_BUSTER = 'v1';

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createAppQueryClient());
  const [persister] = useState(() => createQueryCachePersister());

  return (
    <AuthProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: CACHE_MAX_AGE_MS,
          buster: CACHE_BUSTER,
          dehydrateOptions: {
            shouldDehydrateQuery: query => query.state.status === 'success',
          },
        }}
      >
        {children}
      </PersistQueryClientProvider>
    </AuthProvider>
  );
}
