import type { ReactNode } from 'react'

export type DrawerType = string

export type DrawerOpenParams = {
  type: DrawerType
  title: string
  children: ReactNode
}

type DrawerState = {
  open: boolean
  active: DrawerOpenParams | null
}

let state: DrawerState = { open: false, active: null }
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function subscribeDrawer(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getDrawerState(): DrawerState {
  return state
}

export function openDrawer(params: DrawerOpenParams) {
  state = { open: true, active: params }
  emit()
}

export function closeDrawer(params: { type: DrawerType }) {
  if (!state.open || !state.active) return
  if (state.active.type !== params.type) return
  state = { open: false, active: null }
  emit()
}
