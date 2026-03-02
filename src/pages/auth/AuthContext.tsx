import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { logbit } from '@thedatablitz/logbit-sdk'
import { LOGBIT_PROJECT_ID } from '../../utils/errorHandling'
import { getSupabase, isAuthConfigured } from './supabaseClient'

type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; session: Session }

type AuthContextValue = {
  state: AuthState
  signOut: () => Promise<void>
  /** When auth is not configured, we treat the app as "allowed" (no login required). */
  isAllowed: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isAuthConfigured ? { status: 'loading' } : { status: 'unauthenticated' }
  )

  useEffect(() => {
    if (!isAuthConfigured) {
      logbit.warn('Auth not configured, skipping initialization', {
        projectId: LOGBIT_PROJECT_ID,
        title: 'Auth not configured',
      })
      throw new Error(
        'Supabase auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
      )
    }

    const supabase = getSupabase()
    if (!supabase) {
      logbit.error('Supabase client is null despite isAuthConfigured=true', {
        projectId: LOGBIT_PROJECT_ID,
        title: 'Supabase client is null',
        context: 'AuthProvider',
      })
      setState({ status: 'unauthenticated' })
      return
    }

    let isMounted = true

    const setSession = (session: Session | null) => {
      if (isMounted) {
        setState(
          session
            ? { status: 'authenticated', session }
            : { status: 'unauthenticated' }
        )
      }
    }

    // Initialize session from storage
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          logbit.error('Failed to restore session', {
            projectId: LOGBIT_PROJECT_ID,
            title: 'Failed to restore session',
            context: 'AuthProvider',
            error: error?.message,
          })
          if (isMounted) setState({ status: 'unauthenticated' })
        } else {
          logbit.info('Session restored', {
            projectId: LOGBIT_PROJECT_ID,
            title: 'Session restored',
            userId: session?.user?.id ?? null,
          })
          setSession(session)
        }
      })
      .catch((err) => {
        logbit.error('Unexpected error restoring session', {
          projectId: LOGBIT_PROJECT_ID,
          title: 'Unexpected error restoring session',
          context: 'AuthProvider',
          error: err instanceof Error ? err.message : String(err),
        })
        if (isMounted) setState({ status: 'unauthenticated' })
      })

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logbit.info('Auth state changed', {
        projectId: LOGBIT_PROJECT_ID,
        title: 'Auth state changed',
        event,
        userId: session?.user?.id ?? null,
      })
      setSession(session)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = getSupabase()
    if (supabase) {
      try {
        await supabase.auth.signOut()
      } catch (error) {
        logbit.error('Sign out failed', {
          projectId: LOGBIT_PROJECT_ID,
          title: 'Sign out failed',
          context: 'AuthProvider',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
    setState({ status: 'unauthenticated' })
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const isAllowed = !isAuthConfigured || state.status === 'authenticated'
    return { state, signOut, isAllowed }
  }, [state, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

/** When Supabase auth is enabled, use for AuthGate: mustSignIn means redirect to login. */
export function useAuthRequired(): {
  user: { id: string; email?: string } | null
  loading: boolean
  mustSignIn: boolean
} {
  const ctx = useAuth()
  const loading = ctx.state.status === 'loading'
  const user =
    ctx.state.status === 'authenticated'
      ? { id: ctx.state.session.user.id, email: ctx.state.session.user.email }
      : null
  const mustSignIn = isAuthConfigured && !loading && !user
  return { user, loading, mustSignIn }
}
