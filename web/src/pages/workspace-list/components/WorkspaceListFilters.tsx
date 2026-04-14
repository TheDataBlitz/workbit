import type { CSSProperties } from 'react'
import styled from 'styled-components'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Tag as DsTag } from '@thedatablitz/tags'
import { Search } from 'lucide-react'
import { PROTOCOL_FILTERS, type ProtocolFilterId } from '../workspaceListData'
import { wlT } from './wlTokens'

const NavDividerBox = styled.div`
  display: none;
  width: 1px;
  height: 2rem;
  margin: 0 0.5rem;
  flex-shrink: 0;
  background: ${wlT.border};
  opacity: 0.35;

  @media (min-width: 640px) {
    display: block;
  }
`

const SearchWrap = styled.div`
  position: relative;
  flex: 1 1 auto;
  min-width: 12rem;
  max-width: 20rem;
  margin-left: auto;
`

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: ${wlT.space200} ${wlT.space200} ${wlT.space200} 2.5rem;
  font-size: 10px;
  font-family: inherit;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${wlT.pageFg};
  background: ${wlT.surfaceSunken};
  border: 1px solid ${wlT.border};
  outline: none;
  transition: border-color ${wlT.motionStandard} ${wlT.motionEasing};

  &::placeholder {
    color: ${wlT.textSubtle};
    opacity: 0.35;
  }

  &:focus {
    border-color: ${wlT.brandBold};
  }
`

const filterSectionTagStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  opacity: 0.85,
}

const searchIconStyle: CSSProperties = {
  position: 'absolute',
  left: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '1.125rem',
  height: '1.125rem',
  color: wlT.iconSubtle,
  pointerEvents: 'none',
}

export type WorkspaceListFiltersProps = {
  filter: ProtocolFilterId
  onFilterChange: (id: ProtocolFilterId) => void
  query: string
  onQueryChange: (q: string) => void
}

export function WorkspaceListFilters({
  filter,
  onFilterChange,
  query,
  onQueryChange,
}: WorkspaceListFiltersProps) {
  return (
    <div style={{ marginBottom: '3rem', width: '100%' }}>
      <Stack gap="100" fullWidth>
        <Inline align="center" gap="100">
          <DsTag
            id="wl-filter-stack-label"
            variant="neutral"
            size="small"
            label="Filter by Protocol Stack"
            style={filterSectionTagStyle}
          />
        </Inline>
        <Inline wrap gap="100" align="center" fullWidth>
          {PROTOCOL_FILTERS.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? 'primary' : 'outline'}
              size="small"
              onClick={() => onFilterChange(f.id)}
            >
              {f.label}
            </Button>
          ))}
          <NavDividerBox aria-hidden />
          <SearchWrap>
            <Search aria-hidden style={searchIconStyle} strokeWidth={2} />
            <SearchInput
              id="wl-search"
              aria-labelledby="wl-filter-stack-label"
              placeholder="Query workspace..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              autoComplete="off"
            />
          </SearchWrap>
        </Inline>
      </Stack>
    </div>
  )
}
