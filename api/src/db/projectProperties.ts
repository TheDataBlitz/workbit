import { getClient } from './client.js'
import { rowToProjectProperties } from '../utils/supabaseMappers.js'
import type { ProjectProperties } from '../models/types.js'
import type { DbRow } from '../utils/supabaseMappers.js'

const DEFAULT: ProjectProperties = {
  status: 'planned',
  priority: 'high',
  memberIds: [],
  labelIds: [],
}

export async function getProjectPropertiesByTeamId(
  projectId: string
): Promise<ProjectProperties> {
  const { data, error } = await getClient()
    .from('project_properties')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT
  return rowToProjectProperties(data as DbRow)
}

export async function upsertProjectProperties(
  projectId: string,
  props: ProjectProperties
): Promise<void> {
  const row = {
    project_id: projectId,
    status: props.status,
    priority: props.priority,
    lead_id: props.leadId ?? null,
    start_date: props.startDate ?? null,
    end_date: props.endDate ?? null,
    member_ids: props.memberIds ?? [],
    label_ids: props.labelIds ?? [],
  }
  const { error } = await getClient()
    .from('project_properties')
    .upsert(row as never, { onConflict: 'project_id' })
  if (error) throw error
}
