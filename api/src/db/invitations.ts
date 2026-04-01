import { getClient } from './client.js'
import { rowToInvitation } from '../utils/supabaseMappers.js'
import type { Invitation } from '../models/types.js'
import type { DbRow } from '../utils/supabaseMappers.js'

export async function insertInvitation(invitation: Invitation): Promise<void> {
  const row = {
    id: invitation.id,
    email: invitation.email,
    created_at: invitation.createdAt,
  }
  const { error } = await getClient()
    .from('invitations')
    .insert(row as never)
  if (error) throw error
}

export async function getInvitationById(
  id: string
): Promise<Invitation | null> {
  const { data, error } = await getClient()
    .from('invitations')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToInvitation(data as DbRow)
}
