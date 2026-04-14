import type { ApiWorkspace } from '../../types/workspace'

export type WorkspaceCardVisualState =
  | 'active'
  | 'default'
  | 'locked'
  | 'syncing'

export type WorkspaceListTag = {
  label: string
  tone: 'primary' | 'secondary' | 'muted'
}

export type WorkspaceListRow = ApiWorkspace & {
  description: string
  protocol: 'ALPHA' | 'DELTA' | 'EPSILON' | 'OMEGA'
  visualState: WorkspaceCardVisualState
  tags: WorkspaceListTag[]
}

export const PROTOCOL_FILTERS = [
  { id: 'all', label: 'All Protocols' },
  { id: 'ALPHA', label: 'PRTCL // ALPHA' },
  { id: 'DELTA', label: 'PRTCL // DELTA' },
  { id: 'EPSILON', label: 'PRTCL // EPSILON' },
  { id: 'OMEGA', label: 'PRTCL // OMEGA' },
] as const

export type ProtocolFilterId = (typeof PROTOCOL_FILTERS)[number]['id']
