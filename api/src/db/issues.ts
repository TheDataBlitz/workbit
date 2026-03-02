import { getClient } from './client.js'
import { rowToIssue, issueToRow } from '../utils/supabaseMappers.js'
import type { Issue } from '../models/types.js'
import type { DbRow } from '../utils/supabaseMappers.js'

export async function getIssueById(issueId: string): Promise<Issue | null> {
  const { data, error } = await getClient()
    .from('issues')
    .select('*')
    .eq('id', issueId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToIssue(data as DbRow)
}

export async function getIssuesByTeamId(
  teamId: string,
  filter?: 'all' | 'active' | 'backlog'
): Promise<Issue[]> {
  const q = getClient()
    .from('issues')
    .select('*')
    .eq('team_id', teamId)
    .order('id')
  const { data, error } = await q
  if (error) throw error
  let list = (data ?? []).map((r) => rowToIssue(r as DbRow))
  if (filter === 'active') {
    list = list.filter((i) => i.status !== 'backlog' && i.status !== 'done')
  } else if (filter === 'backlog') {
    list = list.filter((i) => i.status === 'backlog')
  }
  return list
}

export async function getIssuesByProjectId(
  projectId: string,
  filter?: 'all' | 'active' | 'backlog'
): Promise<Issue[]> {
  const q = getClient()
    .from('issues')
    .select('*')
    .eq('project_id', projectId)
    .order('id')
  const { data, error } = await q
  if (error) throw error
  let list = (data ?? []).map((r) => rowToIssue(r as DbRow))
  if (filter === 'active') {
    list = list.filter((i) => i.status !== 'backlog' && i.status !== 'done')
  } else if (filter === 'backlog') {
    list = list.filter((i) => i.status === 'backlog')
  }
  return list
}

export async function getIssuesByAssigneeId(
  assigneeId: string
): Promise<Issue[]> {
  const { data, error } = await getClient()
    .from('issues')
    .select('*')
    .eq('assignee_id', assigneeId)
    .order('id')
  if (error) throw error
  return (data ?? []).map((r) => rowToIssue(r as DbRow))
}

export async function insertIssue(issue: Issue): Promise<void> {
  const row = issueToRow(issue)
  const { error } = await getClient()
    .from('issues')
    .insert(row as never)
  if (error) throw error
}

export async function updateIssue(
  issueId: string,
  patch: Partial<
    Pick<
      Issue,
      'status' | 'assigneeId' | 'assigneeName' | 'projectId' | 'description'
    >
  >
): Promise<Issue | null> {
  const existing = await getIssueById(issueId)
  if (!existing) return null
  const updated: Issue = { ...existing, ...patch }
  const row = issueToRow(updated)
  const { error } = await getClient()
    .from('issues')
    .update(row as never)
    .eq('id', issueId)
  if (error) throw error
  return updated
}
