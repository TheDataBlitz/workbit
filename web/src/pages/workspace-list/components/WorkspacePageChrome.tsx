import type { ReactNode } from 'react'
import styled from 'styled-components'
import { wlT } from './wlTokens'

const PageShell = styled.div`
  position: relative;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  background-color: ${wlT.pageBg};
  color: ${wlT.pageFg};
  overflow-x: hidden;

  &::selection {
    background: ${wlT.selectionBg};
    color: ${wlT.selectionFg};
  }
`

const MainShell = styled.main`
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 5rem 1.5rem 3rem;

  @media (min-width: 768px) {
    padding-left: 3rem;
    padding-right: 3rem;
  }

  @media (min-width: 1024px) {
    padding-left: 5rem;
    padding-right: 5rem;
  }
`

export function WorkspacePageChrome({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <MainShell>{children}</MainShell>
    </PageShell>
  )
}
