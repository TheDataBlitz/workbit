import type {
  PersistedClient,
  Persister,
} from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { getMmkv } from '../storage/mmkv';

export const QUERY_CACHE_STORAGE_KEY = 'workbit.tanstack-query-cache';

function createMemoryQueryPersister(): Persister {
  let saved: PersistedClient | undefined;
  return {
    persistClient: async client => {
      saved = client;
    },
    restoreClient: async () => saved,
    removeClient: async () => {
      saved = undefined;
    },
  };
}

/** Call from provider `useState` initializer so MMKV opens after the runtime is up. */
export function createQueryCachePersister(): Persister {
  const mmkv = getMmkv();
  if (!mmkv) {
    return createMemoryQueryPersister();
  }

  const mmkvAsStorage = {
    getItem: (key: string): string | null => mmkv.getString(key) ?? null,
    setItem: (key: string, value: string) => {
      mmkv.set(key, value);
    },
    removeItem: (key: string) => {
      mmkv.remove(key);
    },
  } as const;

  return createSyncStoragePersister({
    storage: mmkvAsStorage,
    key: QUERY_CACHE_STORAGE_KEY,
    throttleTime: 2000,
  });
}
