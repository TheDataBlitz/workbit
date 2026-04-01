import styled from 'styled-components'

export const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
`

export const Count = styled.span`
  font-size: 0.875rem;
  font-weight: 400;
  color: ${(p) => p.theme.colors.textMuted};
`
