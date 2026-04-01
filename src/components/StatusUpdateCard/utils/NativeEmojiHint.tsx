import { useCallback, useRef, type CSSProperties, type RefObject } from 'react'
import { SmilePlus } from 'lucide-react'

import { Button } from '@thedatablitz/button'
import { Popup } from '@thedatablitz/popup'
import type { PopupPlacement } from '@thedatablitz/popup'

const hiddenInputStyle: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const hintStyle: CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--db-color-text-subtle, #6b7280)',
  whiteSpace: 'nowrap',
  padding: '8px 10px',
}

function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /Mac|iPod|iPhone|iPad/.test(navigator.platform) ||
    navigator.userAgent.includes('Mac')
  )
}

function tryOpenNativeEmojiPicker(inputEl: HTMLInputElement | null): void {
  if (!inputEl) return
  inputEl.focus()

  const isMacOs = isMac()
  const key = isMacOs ? ' ' : '.'
  const code = isMacOs ? 'Space' : 'Period'
  const metaKey = true
  const ctrlKey = isMacOs
  const altKey = false
  const shiftKey = false

  const event = new KeyboardEvent('keydown', {
    key,
    code,
    metaKey,
    ctrlKey,
    altKey,
    shiftKey,
    bubbles: true,
  })
  inputEl.dispatchEvent(event)
}

const PLACEMENT_MAP: Record<
  'top' | 'bottom' | 'left' | 'right',
  PopupPlacement
> = {
  top: 'top-right',
  bottom: 'bottom-right',
  left: 'top-left',
  right: 'top-right',
}

type NativeEmojiHintProps = {
  targetRef?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const MAC_SHORTCUT = '⌘⌃Space'
const WIN_SHORTCUT = 'Win + .'

export function NativeEmojiHint({
  targetRef,
  placement = 'top',
  className,
}: NativeEmojiHintProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  const handleTriggerClick = useCallback(() => {
    const target = targetRef?.current ?? hiddenInputRef.current
    if (target) target.focus()
    tryOpenNativeEmojiPicker(hiddenInputRef.current)
  }, [targetRef])

  const shortcut = isMac() ? MAC_SHORTCUT : WIN_SHORTCUT

  return (
    <>
      <input
        ref={hiddenInputRef}
        type="text"
        aria-hidden
        tabIndex={-1}
        readOnly
        data-emoji-input
        style={hiddenInputStyle}
      />
      <Popup
        trigger={
          <Button
            buttonType="icon"
            variant="glass"
            size="small"
            aria-label="Open emoji picker"
            icon={<SmilePlus size={18} />}
            onClick={handleTriggerClick}
          />
        }
        placement={PLACEMENT_MAP[placement]}
        showCloseButton={false}
        className={className}
      >
        <div style={hintStyle}>Use {shortcut} to open the emoji picker</div>
      </Popup>
    </>
  )
}
