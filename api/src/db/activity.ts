import { getClient } from './client.js'
import { rowToActivity } from '../utils/supabaseMappers.js'
import type { ActivityItem } from '../models/types.js'
import type { DbRow } from '../utils/supabaseMappers.js'

export async function getActivityByProjectId(
  projectId: string,
  limit = 50
): Promise<ActivityItem[]> {
  const { data, error } = await getClient()
    .from('activity')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((r) => rowToActivity(r as DbRow))
}
