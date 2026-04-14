import type { CSSProperties } from 'react'
import styled from 'styled-components'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { CirclePlus } from 'lucide-react'
import { wlT } from './wlTokens'

const AddCard = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  min-height: 240px;
  padding: ${wlT.space400};
  border: 2px dashed ${wlT.border};
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color ${wlT.motionStandard} ${wlT.motionEasing},
    background ${wlT.motionStandard} ${wlT.motionEasing};

  &:hover {
    border-color: ${wlT.brandBold};
    background: ${wlT.brandSubtle};
  }

  &:hover .wl-add-icon {
    color: ${wlT.brandBold};
    transform: scale(1.1);
  }

  &:hover .wl-add-title {
    color: ${wlT.brandBold};
  }

  &:hover .wl-add-shade {
    opacity: 1;
  }
`

const AddCardBody = styled.div`
  position: relative;
  z-index: 1;
  flex: 1;
  width: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`

const AddShade = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent, ${wlT.brandSubtle});
  opacity: 0;
  transition: opacity ${wlT.motionStandard} ${wlT.motionEasing};
  pointer-events: none;
`

const addIconStyle: CSSProperties = {
  width: '4rem',
  height: '4rem',
  flexShrink: 0,
  color: wlT.iconSubtle,
  opacity: 0.45,
  transition: `color ${wlT.motionStandard} ${wlT.motionEasing}, transform ${wlT.motionStandard} ${wlT.motionEasing}`,
}

export type WorkspaceAddCardProps = {
  onAdd?: () => void
}

export function WorkspaceAddCard({ onAdd }: WorkspaceAddCardProps) {
  return (
    <AddCard type="button" onClick={() => onAdd?.()}>
      <AddShade className="wl-add-shade" aria-hidden />
      <AddCardBody>
        <Stack gap="400" align="center" justify="center" fullWidth>
          <CirclePlus
            className="wl-add-icon"
            aria-hidden
            style={addIconStyle}
            strokeWidth={1.25}
          />
          <Stack gap="100" align="center" fullWidth>
            <Text as="div" variant="heading6" color="color.text.subtle">
              INITIALIZE
              <br />
              NEW STACK
            </Text>
            <Text as="div" variant="caption2" color="color.text.subtle">
              Protocol Auth Required
            </Text>
          </Stack>
        </Stack>
      </AddCardBody>
    </AddCard>
  )
}
