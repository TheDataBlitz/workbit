import styled from 'styled-components'
import { pdT } from '../pdTokens'
import { ProjectDecisionCard } from '../../../components'
import { useParams } from 'react-router-dom'
import { useProjectDecisions } from '../hooks'
import type { ProjectDecisionRow } from '../projectDecisionsMock'
import { Text } from '@thedatablitz/text'

const Wrap = styled.div`
  position: relative;
  width: 100%;
`

const Watermark = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 2rem;
  font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif;
  font-size: clamp(3.5rem, 14vw, 9rem);
  font-weight: 800;
  letter-spacing: 0.06em;
  color: ${pdT.pageFg};
  opacity: 0.045;
  user-select: none;
  z-index: 0;
`

const List = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: ${pdT.space400};
  width: 100%;
`

function formatDateLabel(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function statusLabel(s: string): string {
  return s.toUpperCase().replace(/_/g, ' ')
}

function statusVariant(s: string): ProjectDecisionRow['statusBadgeVariant'] {
  const v = s.toLowerCase()
  if (v === 'approved') return 'secondary'
  if (v === 'rejected') return 'neutral'
  if (v === 'superseded') return 'neutral'
  return 'primary'
}

export function ProjectDecisionsTab() {
  const { projectId } = useParams<{ projectId: string }>()
  const decisionsQuery = useProjectDecisions(projectId)
  const apiRows: ProjectDecisionRow[] =
    decisionsQuery.data?.items.map((d, idx) => ({
      id: d.id,
      statusLabel: statusLabel(d.status),
      statusBadgeVariant: statusVariant(d.status),
      dateLabel: formatDateLabel(d.decisionDate ?? d.createdAt),
      title: d.title,
      authorName: d.createdBy?.name ?? 'Unknown',
      authorAvatarSrc: undefined,
      authorAvatarAlt: undefined,
      rationale: d.rationale,
      impact: d.impact ?? '—',
      defaultExpanded: idx === 0,
      subdued: d.status === 'superseded',
    })) ?? []

  return (
    <Wrap aria-label="Project decisions">
      <Watermark aria-hidden>DECISIONS</Watermark>
      <List>
        {decisionsQuery.isLoading ? (
          <div style={{ padding: `${pdT.space300} ${pdT.space200}` }}>
            <Text as="span" variant="body4" color="color.text.subtle">
              Loading decisions…
            </Text>
          </div>
        ) : apiRows.length === 0 ? (
          <div style={{ padding: `${pdT.space300} ${pdT.space200}` }}>
            <Text as="span" variant="body4" color="color.text.subtle">
              No decisions found for this project.
            </Text>
          </div>
        ) : (
          apiRows.map((row) => <ProjectDecisionCard key={row.id} row={row} />)
        )}
      </List>
    </Wrap>
  )
}
