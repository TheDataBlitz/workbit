import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseAuthStorage } from './supabaseStorage';

// Use process.env.* so Metro never resolves a virtual `@env` module. Values are
// inlined from mobile/.env by the react-native-dotenv Babel plugin.
// Fall back to VITE_* so the same keys as the web app work if you copy root .env.
const supabaseUrl = String(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '',
).trim();
const supabaseAnonKey = String(
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? '',
).trim();

export const isAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

if (isAuthConfigured) {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: supabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabase(): SupabaseClient | null {
  return client;
}

export async function getAccessToken(): Promise<string | null> {
  if (!client) {
    return null;
  }
  const {
    data: { session },
  } = await client.auth.getSession();
  return session?.access_token ?? null;
}
