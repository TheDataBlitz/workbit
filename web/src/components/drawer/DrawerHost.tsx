import { useEffect, useSyncExternalStore } from 'react'
import styled from 'styled-components'
import { Stack } from '@thedatablitz/stack'
import { Inline } from '@thedatablitz/inline'
import { Text } from '@thedatablitz/text'
import { X } from 'lucide-react'
import { pdT } from '../../pages/project-detail/pdTokens'
import { closeDrawer, getDrawerState, subscribeDrawer } from './drawerStore'

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  opacity: ${(p) => (p.$open ? 1 : 0)};
  pointer-events: ${(p) => (p.$open ? 'auto' : 'none')};
  transition: opacity 160ms ease;
  z-index: 1000;
`

const Panel = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(92vw, 26rem);
  background: ${pdT.surfaceRaised};
  border-left: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
  transform: translateX(${(p) => (p.$open ? '0' : '100%')});
  transition: transform 180ms ease;
  z-index: 1001;
  display: flex;
  flex-direction: column;
`

const Header = styled.header`
  padding: ${pdT.space300} ${pdT.space300};
  border-bottom: 1px solid color-mix(in srgb, ${pdT.border} 25%, transparent);
`

const Body = styled.div`
  padding: ${pdT.space300};
  overflow: auto;
  flex: 1;
`

const CloseButton = styled.button`
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
  background: ${pdT.surfaceOverlay};
  color: ${pdT.pageFg};
  height: 34px;
  width: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`

export function DrawerHost() {
  const drawerState = useSyncExternalStore(
    subscribeDrawer,
    getDrawerState,
    getDrawerState
  )

  const active = drawerState.active

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      if (!active) return
      closeDrawer({ type: active.type })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active])

  return (
    <>
      <Overlay
        $open={drawerState.open}
        onClick={() => {
          if (!active) return
          closeDrawer({ type: active.type })
        }}
        aria-hidden
      />
      <Panel
        $open={drawerState.open}
        role="dialog"
        aria-modal="true"
        aria-label={active?.title ?? 'Drawer'}
      >
        <Header>
          <Inline align="center" justify="space-between" gap="200" wrap={false}>
            <Stack gap="050">
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  opacity: 0.7,
                }}
              >
                {active?.type ?? 'drawer'}
              </Text>
              <Text as="h2" variant="heading6" style={{ margin: 0 }}>
                {active?.title ?? ''}
              </Text>
            </Stack>
            <CloseButton
              type="button"
              onClick={() => {
                if (!active) return
                closeDrawer({ type: active.type })
              }}
              aria-label="Close drawer"
            >
              <X size={18} />
            </CloseButton>
          </Inline>
        </Header>
        <Body>{active?.children}</Body>
      </Panel>
    </>
  )
}
