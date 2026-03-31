import type { ApiDecisionStatus, ApiDecisionType } from '../../../api/client'

import type { DecisionForm } from '../types'

export const EMPTY_FORM: DecisionForm = {
  title: '',
  type: 'minor',
  status: 'approved',
  rationale: '',
  impact: '',
  decisionDate: '',
  tagsCsv: '',
  linkedIssueIdsCsv: '',
}

export function toCsv(values: string[]): string {
  return values.join(', ')
}

export function csvToArray(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function typeBadgeClass(type: ApiDecisionType): string {
  return type === 'major'
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-sky-50 text-sky-700 border-sky-200'
}

export function statusBadgeClass(status: ApiDecisionStatus): string {
  if (status === 'approved') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (status === 'rejected') {
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }
  if (status === 'superseded') {
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }
  return 'bg-indigo-50 text-indigo-700 border-indigo-200'
}
