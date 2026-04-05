import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  AuthContext,
  type AuthContextValue,
  type AuthState,
} from './auth-context';
import { getSupabase, isAuthConfigured } from './supabaseClient';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() =>
    isAuthConfigured ? { status: 'loading' } : { status: 'unauthenticated' },
  );

  useEffect(() => {
    if (!isAuthConfigured) {
      if (__DEV__) {
        console.warn(
          '[workbit] Supabase auth not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in mobile/.env (see .env.example).',
        );
      }
      return;
    }

    const supabase = getSupabase();
    if (!supabase) {
      setState({ status: 'unauthenticated' });
      return;
    }

    let isMounted = true;

    const setSession = (session: Session | null) => {
      if (isMounted) {
        setState(
          session
            ? { status: 'authenticated', session }
            : { status: 'unauthenticated' },
        );
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          if (__DEV__) {
            console.warn('[workbit] Failed to restore session', error.message);
          }
          if (isMounted) {
            setState({ status: 'unauthenticated' });
          }
        } else {
          setSession(session);
        }
      })
      .catch(err => {
        if (__DEV__) {
          console.warn('[workbit] Unexpected error restoring session', err);
        }
        if (isMounted) {
          setState({ status: 'unauthenticated' });
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        if (__DEV__) {
          console.warn('[workbit] Sign out failed', e);
        }
      }
    }
    setState({ status: 'unauthenticated' });
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const isAllowed = !isAuthConfigured || state.status === 'authenticated';
    return { state, signOut, isAllowed };
  }, [state, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
