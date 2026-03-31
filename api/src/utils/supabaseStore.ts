/**
 * Supabase store writer for seeding only.
 * Normal reads go through the db/ layer with scoped queries (no full-table loads).
 * This module is only used by seed.ts to write the initial/dummy store.
 */
import { supabaseAdmin, isSupabaseConfigured } from './supabaseServer.js'
import type { Store } from '../models/types.js'
import { storeToRows, type DbRow } from './supabaseMappers.js'

function getClient() {
  if (!isSupabaseConfigured() || !supabaseAdmin) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }
  return supabaseAdmin
}

/**
 * Write a full store to Supabase (replace rows in each table).
 * Used only for seeding (seedIfEmpty, seedDummy). Do not use for normal API writes.
 */
export async function writeStoreSupabase(store: Store): Promise<void> {
  const client = getClient()

  const rows = storeToRows(store)
  const ordered = [
    { table: 'workspaces', rows: rows.workspaces, idColumn: 'id' as const },
    { table: 'roles', rows: rows.roles, idColumn: 'id' as const },
    { table: 'members', rows: rows.members, idColumn: 'id' as const },
    { table: 'teams', rows: rows.teams, idColumn: 'id' as const },
    { table: 'projects', rows: rows.projects, idColumn: 'id' as const },
    { table: 'invitations', rows: rows.invitations, idColumn: 'id' as const },
    {
      table: 'project_properties',
      rows: rows.project_properties,
      idColumn: 'team_id' as const,
    },
    {
      table: 'status_updates',
      rows: rows.status_updates,
      idColumn: 'id' as const,
    },
    { table: 'activity', rows: rows.activity, idColumn: 'id' as const },
    { table: 'issues', rows: rows.issues, idColumn: 'id' as const },
    { table: 'decisions', rows: rows.decisions, idColumn: 'id' as const },
    {
      table: 'notifications',
      rows: rows.notifications,
      idColumn: 'id' as const,
    },
  ]

  for (const { table, rows: data, idColumn } of ordered) {
    const existing = await client.from(table).select(idColumn)
    if (existing.error) throw existing.error
    const keys = (existing.data ?? []).map((r: DbRow) => r[idColumn] as string)
    if (keys.length > 0) {
      const { error } = await client.from(table).delete().in(idColumn, keys)
      if (error) throw error
    }
    if (data.length > 0) {
      const { error } = await client.from(table).insert(data as never[])
      if (error) throw error
    }
  }
}

export async function ensureStoreRow(): Promise<void> {
  if (!isSupabaseConfigured() || !supabaseAdmin) return
  await supabaseAdmin.from('projects').select('id').limit(1).maybeSingle()
}
