export type InteleBitOpenDetail = {
  projectId: string
  projectName?: string
  /** Tenant key for AI usage (workspace id). */
  shopId?: string
}

export const INTELEBIT_OPEN = 'intelebit:open'
export const INTELEBIT_CLOSE = 'intelebit:close'

export const inteleBitBus = new EventTarget()

export function emitInteleBitOpen(detail: InteleBitOpenDetail) {
  inteleBitBus.dispatchEvent(
    new CustomEvent<InteleBitOpenDetail>(INTELEBIT_OPEN, { detail })
  )
}

export function emitInteleBitClose() {
  inteleBitBus.dispatchEvent(new Event(INTELEBIT_CLOSE))
}
