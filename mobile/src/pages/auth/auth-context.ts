import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; session: Session };

export type AuthContextValue = {
  state: AuthState;
  signOut: () => Promise<void>;
  /** When auth is not configured, the app is treated as allowed without login. */
  isAllowed: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
