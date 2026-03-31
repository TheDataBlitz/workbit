import { getClient } from './client.js'
import { rowToStatusUpdate } from '../utils/supabaseMappers.js'
import type { StatusUpdate } from '../models/types.js'
import type { DbRow } from '../utils/supabaseMappers.js'

export async function getStatusUpdatesByTeamId(
  teamId: string,
  limit = 20
): Promise<StatusUpdate[]> {
  const { data, error } = await getClient()
    .from('status_updates')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((r) => rowToStatusUpdate(r as DbRow))
}

export async function getStatusUpdatesByProjectId(
  projectId: string,
  limit = 20
): Promise<StatusUpdate[]> {
  const { data, error } = await getClient()
    .from('status_updates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((r) => rowToStatusUpdate(r as DbRow))
}

export async function getStatusUpdatesByIssueId(
  issueId: string,
  limit = 20
): Promise<StatusUpdate[]> {
  const { data, error } = await getClient()
    .from('status_updates')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((r) => rowToStatusUpdate(r as DbRow))
}

export async function getStatusUpdateById(
  id: string
): Promise<StatusUpdate | null> {
  const { data, error } = await getClient()
    .from('status_updates')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToStatusUpdate(data as DbRow)
}

export async function insertStatusUpdate(update: StatusUpdate): Promise<void> {
  const row = {
    id: update.id,
    team_id: update.teamId ?? null,
    status: update.status,
    content: update.content,
    author_id: update.authorId,
    author_name: update.authorName,
    author_avatar_src: update.authorAvatarSrc ?? null,
    created_at: update.createdAt,
    comment_count: update.commentCount ?? 0,
    project_id: update.projectId ?? null,
    issue_id: update.issueId ?? null,
  }
  const { error } = await getClient()
    .from('status_updates')
    .insert(row as never)
  if (error) throw error
}

export async function updateStatusUpdateCommentCount(
  id: string,
  commentCount: number
): Promise<void> {
  const { error } = await getClient()
    .from('status_updates')
    .update({ comment_count: commentCount })
    .eq('id', id)
  if (error) throw error
}
