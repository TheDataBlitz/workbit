import { getClient } from './client.js'
import { rowToMember } from '../utils/supabaseMappers.js'
import type { Member } from '../models/types.js'
import type { DbRow } from '../utils/supabaseMappers.js'

function memberToRow(m: Member): Record<string, unknown> {
  return {
    id: m.id,
    name: m.name,
    username: m.username,
    avatar_src: m.avatarSrc ?? null,
    status: m.status,
    joined: m.joined,
    team_ids: m.teamIds ?? [],
    provisioned: m.provisioned ?? false,
    supabase_user_id: m.uid ?? m.userAuthId ?? null,
  }
}

export async function getMemberById(memberId: string): Promise<Member | null> {
  const { data, error } = await getClient()
    .from('members')
    .select('*')
    .eq('id', memberId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToMember(data as DbRow)
}

export async function getMemberByUid(uid: string): Promise<Member | null> {
  const { data, error } = await getClient()
    .from('members')
    .select('*')
    .eq('supabase_user_id', uid)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToMember(data as DbRow)
}

export async function getMembers(): Promise<Member[]> {
  const { data, error } = await getClient()
    .from('members')
    .select('*')
    .order('id')
  if (error) throw error
  return (data ?? []).map((r) => rowToMember(r as DbRow))
}

export async function getMembersByTeamId(teamId: string): Promise<Member[]> {
  const { data, error } = await getClient()
    .from('members')
    .select('*')
    .filter('team_ids', 'cs', JSON.stringify([teamId]))
    .order('id')
  if (error) throw error
  return (data ?? []).map((r) => rowToMember(r as DbRow))
}

export async function insertMember(member: Member): Promise<void> {
  const { error } = await getClient()
    .from('members')
    .insert(memberToRow(member) as never)
  if (error) throw error
}

export async function updateMember(
  memberId: string,
  patch: Partial<Pick<Member, 'provisioned' | 'uid' | 'userAuthId'>>
): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.provisioned !== undefined) row.provisioned = patch.provisioned
  if (patch.uid !== undefined) row.supabase_user_id = patch.uid
  if (patch.userAuthId !== undefined) row.supabase_user_id = patch.userAuthId
  if (Object.keys(row).length === 0) return
  const { error } = await getClient()
    .from('members')
    .update(row as never)
    .eq('id', memberId)
  if (error) throw error
}

export async function updateMemberTeamIds(
  memberId: string,
  teamIds: string[]
): Promise<void> {
  const { error } = await getClient()
    .from('members')
    .update({ team_ids: teamIds } as never)
    .eq('id', memberId)
  if (error) throw error
}
