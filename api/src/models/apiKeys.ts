import { supabaseAdmin, isSupabaseConfigured } from '../utils/supabaseServer.js'
import { logApiError } from '../utils/log.js'

export type ApiKeyRow = {
  id: string
  name: string | null
  masked_key: string
  created_at: string
}

/**
 * List API keys for a user (masked). Returns [] when Supabase is not configured or on error.
 */
export async function listKeysForUser(userId: string): Promise<ApiKeyRow[]> {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, last_four, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    logApiError(new Error(error.message), 'apiKeys.listKeysForUser', { userId })
    throw new Error(error.message)
  }

  return (data || []).map(
    (row: {
      id: string
      name: string | null
      last_four: string | null
      created_at: string
    }) => ({
      id: String(row.id),
      name: row.name ?? null,
      masked_key: row.last_four ? `••••••••${row.last_four}` : '••••••••',
      created_at:
        typeof row.created_at === 'string'
          ? row.created_at
          : new Date(row.created_at as unknown as number).toISOString(),
    })
  )
}
