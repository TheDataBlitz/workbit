import { createClient } from '@supabase/supabase-js'
import { logApiWarn } from './log.js'

const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? ''

if (supabaseUrl && !supabaseServiceKey) {
  logApiWarn(
    'SUPABASE_SERVICE_ROLE_KEY is missing. Add it to api/.env to use Supabase; otherwise the API uses fileStore.'
  )
}

/**
 * Server-side Supabase client with service role key.
 * Use for reading/writing the store table and admin operations.
 */
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null

/**
 * Server-side Supabase client with anon key for auth operations (e.g. signInWithPassword).
 * Used by the login route to issue sessions.
 */
export const supabaseAuth =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      })
    : null

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseServiceKey)
}

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey)
}
