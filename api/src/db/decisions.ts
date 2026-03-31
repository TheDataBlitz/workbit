import { getClient } from './client.js'
import { rowToDecision, decisionToRow } from '../utils/supabaseMappers.js'
import type { Decision, DecisionStatus, DecisionType } from '../models/types.js'
import type { DbRow } from '../utils/supabaseMappers.js'

export type DecisionListFilter = {
  type?: DecisionType
  status?: DecisionStatus
  fromDate?: string
  toDate?: string
}

export async function getDecisionById(
  decisionId: string
): Promise<Decision | null> {
  const { data, error } = await getClient()
    .from('decisions')
    .select('*')
    .eq('id', decisionId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return rowToDecision(data as DbRow)
}

export async function getDecisionsByProjectId(
  projectId: string,
  filters?: DecisionListFilter
): Promise<Decision[]> {
  let query = getClient()
    .from('decisions')
    .select('*')
    .eq('project_id', projectId)

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.fromDate) {
    query = query.gte('decision_date', filters.fromDate)
  }
  if (filters?.toDate) {
    query = query.lte('decision_date', filters.toDate)
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((r) => rowToDecision(r as DbRow))
}

export async function insertDecision(decision: Decision): Promise<void> {
  const row = decisionToRow(decision)
  const { error } = await getClient()
    .from('decisions')
    .insert(row as never)
  if (error) throw error
}

export async function updateDecision(
  decisionId: string,
  patch: Partial<
    Pick<
      Decision,
      | 'title'
      | 'type'
      | 'rationale'
      | 'impact'
      | 'tags'
      | 'decisionDate'
      | 'status'
      | 'linkedIssueIds'
    >
  >
): Promise<Decision | null> {
  const existing = await getDecisionById(decisionId)
  if (!existing) return null

  const updated: Decision = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }

  const row = decisionToRow(updated)
  const { error } = await getClient()
    .from('decisions')
    .update(row as never)
    .eq('id', decisionId)

  if (error) throw error
  return updated
}

export async function deleteDecision(decisionId: string): Promise<boolean> {
  const { error, count } = await getClient()
    .from('decisions')
    .delete({ count: 'exact' })
    .eq('id', decisionId)

  if (error) throw error
  return (count ?? 0) > 0
}
