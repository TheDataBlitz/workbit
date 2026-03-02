import { useState, useEffect, useCallback } from 'react'
import { logError } from '../utils/errorHandling'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Generic data-fetching hook.
 * @param fn  Async function that returns the data. Re-runs when `deps` change.
 * @param deps  Dependency array (like useEffect). Pass [] for one-time load.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFetch<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fn()
      setState({ data, loading: false, error: null })
    } catch (e) {
      logError(e, 'useFetch')
      setState({ data: null, loading: false, error: (e as Error).message })
    }
  }, deps)

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: load }
}
