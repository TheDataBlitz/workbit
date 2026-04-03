import { useEffect, useRef } from 'react'

import {
  INTELEBIT_CLOSE,
  INTELEBIT_OPEN,
  inteleBitBus,
  type InteleBitOpenDetail,
} from './inteleBitBus'

export function attachInteleBitBusListeners(
  onOpenEvent: (e: Event) => void,
  onCloseEvent: () => void
): () => void {
  inteleBitBus.addEventListener(INTELEBIT_OPEN, onOpenEvent)
  inteleBitBus.addEventListener(INTELEBIT_CLOSE, onCloseEvent)
  return () => {
    inteleBitBus.removeEventListener(INTELEBIT_OPEN, onOpenEvent)
    inteleBitBus.removeEventListener(INTELEBIT_CLOSE, onCloseEvent)
  }
}

export function useInteleBitBus(
  onOpen: (detail: InteleBitOpenDetail) => void,
  onClose: () => void
) {
  const onOpenRef = useRef(onOpen)
  const onCloseRef = useRef(onClose)
  onOpenRef.current = onOpen
  onCloseRef.current = onClose

  useEffect(() => {
    return attachInteleBitBusListeners(
      (e) => {
        const d = (e as CustomEvent<InteleBitOpenDetail>).detail
        onOpenRef.current(d)
      },
      () => onCloseRef.current()
    )
  }, [])
}
