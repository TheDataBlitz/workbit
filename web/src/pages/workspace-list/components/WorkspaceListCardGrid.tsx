import styled from 'styled-components'
import { Box } from '@thedatablitz/box'
import type { ApiWorkspace } from '../../../types/workspace'
import type { WorkspaceListRow } from '../workspaceListData'
import { WorkspaceAddCard } from './WorkspaceAddCard'
import { WorkspaceCard } from './WorkspaceCard'
import { wlT } from './wlTokens'

const CardGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: ${wlT.space200};

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(4, 1fr);
  }
`

export type WorkspaceListCardGridProps = {
  rows: WorkspaceListRow[]
  onSelectWorkspace?: (workspace: ApiWorkspace) => void
  onAddWorkspace?: () => void
}

export function WorkspaceListCardGrid({
  rows,
  onSelectWorkspace,
  onAddWorkspace,
}: WorkspaceListCardGridProps) {
  return (
    <Box fullWidth>
      <CardGrid>
        {rows.map((row) => (
          <WorkspaceCard key={row.id} row={row} onSelect={onSelectWorkspace} />
        ))}
        <WorkspaceAddCard onAdd={onAddWorkspace} />
      </CardGrid>
    </Box>
  )
}
