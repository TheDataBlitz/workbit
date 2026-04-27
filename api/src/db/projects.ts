import { getClient } from './client.js'
import { rowToProject } from '../utils/supabaseMappers.js'
import type { Project } from '../models/types.js'
import type { DbRow } from '../utils/supabaseMappers.js'

function projectToRow(p: Project): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    workspace_id: p.workspaceId,
    status: p.status,
  }
}

export async function getProjectById(
  projectId: string
): Promise<Project | null> {
  const { data, error } = await getClient()
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToProject(data as DbRow)
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await getClient()
    .from('projects')
    .select('*')
    .order('id')
  if (error) throw error
  return (data ?? []).map((r) => rowToProject(r as DbRow))
}

export async function insertProject(project: Project): Promise<void> {
  const { error } = await getClient()
    .from('projects')
    .insert(projectToRow(project) as never)
  if (error) throw error
}

export async function updateProject(
  projectId: string,
  patch: Partial<Pick<Project, 'name' | 'description' | 'status'>>
): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.name !== undefined) row.name = patch.name
  if (patch.description !== undefined) row.description = patch.description
  if (patch.status !== undefined) row.status = patch.status
  if (Object.keys(row).length === 0) return
  const { error } = await getClient()
    .from('projects')
    .update(row as never)
    .eq('id', projectId)
  if (error) throw error
}
