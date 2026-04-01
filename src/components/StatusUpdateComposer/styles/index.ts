import styled from 'styled-components'

export const Container = styled.div`
  --status-on-track: ${(p) => p.theme.colors.success};
  --status-at-risk: ${(p) => p.theme.colors.warning};
  --status-off-track: ${(p) => p.theme.colors.error};
  display: flex;
  flex-direction: column;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii?.md ?? 6}px;
  /* Avoid overflow: hidden so the status Menu dropdown positions relative to its trigger, not this card */
  overflow: visible;
`

export const StatusRow = styled.div`
  padding: ${(p) => p.theme.spacing[2]}px ${(p) => p.theme.spacing[3]}px;
`

export const StatusPill = styled.button<{
  $color: 'success' | 'warning' | 'error'
}>`
  display: inline-flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing[1]}px;
  padding: ${(p) => p.theme.spacing[1]}px ${(p) => p.theme.spacing[2]}px;
  border-radius: 9999px;
  border: 1px solid ${(p) => p.theme.colors[p.$color]};
  background: transparent;
  color: ${(p) => p.theme.colors[p.$color]};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
  &:hover {
    opacity: 0.9;
  }
`

export const TextAreaWrap = styled.div`
  padding: 0 ${(p) => p.theme.spacing[3]}px ${(p) => p.theme.spacing[2]}px;
`

export const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${(p) => p.theme.colors.border};
  margin: 0;
`
