import type { CSSProperties } from 'react'
import styled from 'styled-components'
import { Text } from '@thedatablitz/text'
import { wlT } from './wlTokens'

const HeaderRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${wlT.space400};

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
`

const GradientWord = styled.span`
  display: inline-block;
  background: linear-gradient(
    90deg,
    ${wlT.gradientA},
    ${wlT.gradientB},
    ${wlT.gradientC}
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
`

const heroTitleStyle: CSSProperties = {
  margin: '0 0 1.5rem',
  fontSize: 'clamp(2.75rem, 8vw, 5.5rem)',
  fontWeight: 800,
  letterSpacing: '-0.04em',
  lineHeight: 1.05,
  fontFamily: `'Plus Jakarta Sans', Inter, system-ui, sans-serif`,
}

export function WorkspaceListHero() {
  return (
    <header style={{ marginBottom: '4rem' }}>
      <HeaderRow>
        <div>
          <Text
            as="h1"
            variant="heading1"
            color="color.text.DEFAULT"
            style={heroTitleStyle}
          >
            SELECT
            <br />
            <GradientWord>WORKSPACE</GradientWord>
          </Text>
          <Text
            as="p"
            variant="body2"
            color="color.text.subtle"
            style={{ margin: 0, maxWidth: '36rem', lineHeight: 1.6 }}
          >
            Secure architectural repositories and project frameworks. Isolated
            data persistence with protocol-specific governance.
          </Text>
        </div>
      </HeaderRow>
    </header>
  )
}
