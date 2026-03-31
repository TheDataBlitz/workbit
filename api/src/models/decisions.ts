import { generateId } from './store.js'
import * as db from '../db/decisions.js'
import { getProjectById } from '../db/projects.js'
import type { Decision, DecisionStatus, DecisionType } from './types.js'

export type DecisionListMode = 'sequential' | 'mixed'

export type DecisionListParams = {
  projectId: string
  type?: DecisionType
  status?: DecisionStatus
  fromDate?: string
  toDate?: string
  mode?: DecisionListMode
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export type DecisionApi = {
  id: string
  projectId: string
  title: string
  type: DecisionType
  rationale: string
  impact?: string
  tags: string[]
  createdBy: { id: string; name: string }
  decisionDate?: string
  status: DecisionStatus
  linkedIssueIds: string[]
  createdAt: string
  updatedAt: string
}

function normalizeDateValue(value?: string): number {
  if (!value) return Number.NEGATIVE_INFINITY
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp
}

function byDecisionDateThenCreatedAt(a: Decision, b: Decision): number {
  const aDecision = normalizeDateValue(a.decisionDate)
  const bDecision = normalizeDateValue(b.decisionDate)

  if (aDecision !== bDecision) {
    return bDecision - aDecision
  }

  const aCreated = normalizeDateValue(a.createdAt)
  const bCreated = normalizeDateValue(b.createdAt)
  if (aCreated !== bCreated) {
    return bCreated - aCreated
  }

  return a.id.localeCompare(b.id)
}

function byCreatedAt(a: Decision, b: Decision): number {
  const aCreated = normalizeDateValue(a.createdAt)
  const bCreated = normalizeDateValue(b.createdAt)
  if (aCreated !== bCreated) {
    return bCreated - aCreated
  }
  return a.id.localeCompare(b.id)
}

function applyOrdering(
  list: Decision[],
  mode: DecisionListMode,
  order: 'asc' | 'desc'
): Decision[] {
  const comparator =
    mode === 'mixed' ? byDecisionDateThenCreatedAt : byCreatedAt
  const sorted = [...list].sort(comparator)
  return order === 'asc' ? sorted.reverse() : sorted
}

function toDecisionApi(d: Decision): DecisionApi {
  return {
    id: d.id,
    projectId: d.projectId,
    title: d.title,
    type: d.type,
    rationale: d.rationale,
    impact: d.impact,
    tags: d.tags,
    createdBy: d.createdBy,
    decisionDate: d.decisionDate,
    status: d.status,
    linkedIssueIds: d.linkedIssueIds,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

export async function listDecisionsForApi(params: DecisionListParams): Promise<{
  items: DecisionApi[]
  pagination: { page: number; pageSize: number; total: number }
}> {
  const page = params.page && params.page > 0 ? params.page : 1
  const pageSize =
    params.pageSize && params.pageSize > 0 && params.pageSize <= 100
      ? params.pageSize
      : 20
  const mode = params.mode ?? 'mixed'
  const order = params.order ?? 'desc'

  const all = await db.getDecisionsByProjectId(params.projectId, {
    type: params.type,
    status: params.status,
    fromDate: params.fromDate,
    toDate: params.toDate,
  })

  const ordered = applyOrdering(all, mode, order)
  const start = (page - 1) * pageSize
  const paged = ordered.slice(start, start + pageSize)

  return {
    items: paged.map(toDecisionApi),
    pagination: {
      page,
      pageSize,
      total: ordered.length,
    },
  }
}

export async function createDecisionForApi(input: {
  projectId: string
  title: string
  type: DecisionType
  rationale: string
  impact?: string
  tags?: string[]
  createdBy?: { id?: string; name?: string }
  decisionDate?: string
  status?: DecisionStatus
  linkedIssueIds?: string[]
}): Promise<DecisionApi> {
  const project = await getProjectById(input.projectId)
  if (!project) {
    throw new Error(`Project not found: ${input.projectId}`)
  }

  const now = new Date().toISOString()
  const decision: Decision = {
    id: generateId(),
    projectId: input.projectId,
    title: input.title.trim(),
    type: input.type,
    rationale: input.rationale.trim(),
    impact: input.impact?.trim() || undefined,
    tags: (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
    createdBy: {
      id: input.createdBy?.id?.trim() || 'current-user',
      name: input.createdBy?.name?.trim() || 'You',
    },
    decisionDate: input.decisionDate?.trim() || undefined,
    status: input.status ?? 'approved',
    linkedIssueIds: input.linkedIssueIds ?? [],
    createdAt: now,
    updatedAt: now,
  }

  await db.insertDecision(decision)
  return toDecisionApi(decision)
}

export async function updateDecisionForApi(
  projectId: string,
  decisionId: string,
  patch: {
    title?: string
    type?: DecisionType
    rationale?: string
    impact?: string
    tags?: string[]
    decisionDate?: string
    status?: DecisionStatus
    linkedIssueIds?: string[]
  }
): Promise<DecisionApi | null> {
  const existing = await db.getDecisionById(decisionId)
  if (!existing || existing.projectId !== projectId) return null

  const updated = await db.updateDecision(decisionId, {
    ...(patch.title !== undefined && { title: patch.title.trim() }),
    ...(patch.type !== undefined && { type: patch.type }),
    ...(patch.rationale !== undefined && { rationale: patch.rationale.trim() }),
    ...(patch.impact !== undefined && {
      impact: patch.impact.trim() || undefined,
    }),
    ...(patch.tags !== undefined && {
      tags: patch.tags.map((tag) => tag.trim()).filter(Boolean),
    }),
    ...(patch.decisionDate !== undefined && {
      decisionDate: patch.decisionDate.trim() || undefined,
    }),
    ...(patch.status !== undefined && { status: patch.status }),
    ...(patch.linkedIssueIds !== undefined && {
      linkedIssueIds: patch.linkedIssueIds,
    }),
  })

  return updated ? toDecisionApi(updated) : null
}

export async function deleteDecisionForApi(
  projectId: string,
  decisionId: string
): Promise<boolean> {
  const existing = await db.getDecisionById(decisionId)
  if (!existing || existing.projectId !== projectId) return false
  return db.deleteDecision(decisionId)
}
