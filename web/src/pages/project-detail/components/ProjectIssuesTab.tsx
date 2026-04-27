import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { Accordion, type AccordionItem } from '@thedatablitz/accordion'
import { Avatar } from '@thedatablitz/avatar'
import { Badge } from '@thedatablitz/badge'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Tag as DsTag } from '@thedatablitz/tags'
import { Text } from '@thedatablitz/text'
import { ChevronRight } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { pdT } from '../pdTokens'
import {
  type IssueStatusKind,
  type ProjectIssueItem,
} from '../projectIssuesMock'
import { useProjectIssues } from '../hooks'
import type { ApiProjectIssueListItem } from '../../../api'

const kicker = {
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  opacity: 0.65,
}

const SummaryGrid = styled.div`
  display: grid;
  gap: ${pdT.space200};
  grid-template-columns: 1fr;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, 1fr);
  }
`

const SummaryCard = styled.div`
  box-sizing: border-box;
  padding: ${pdT.space300} ${pdT.space400};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`

const ListShell = styled.div`
  width: 100%;
  box-sizing: border-box;
  padding: ${pdT.space300} ${pdT.space400};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`

const ColumnHeader = styled.div`
  display: none;
  padding: 0 ${pdT.space200} ${pdT.space200};
  margin-bottom: ${pdT.space100};

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns:
      minmax(5.5rem, 7rem) minmax(0, 1fr) minmax(7rem, 9rem)
      minmax(5.5rem, 7rem);
    align-items: end;
    gap: ${pdT.space200};
  }
`

const ColumnLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: ${pdT.textSubtle};
  opacity: 0.75;
`

const DetailGrid = styled.div`
  display: grid;
  gap: ${pdT.space400};
  grid-template-columns: 1fr;

  @media (min-width: 900px) {
    grid-template-columns: 1fr 1fr minmax(14rem, 1.15fr);
  }
`

const SubIssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${pdT.space150};
`

const SubIssueCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${pdT.space200};
  padding: ${pdT.space200} ${pdT.space200} ${pdT.space200} ${pdT.space150};
  background: color-mix(in srgb, ${pdT.pageBg} 55%, ${pdT.surfaceRaised});
  border: 1px solid color-mix(in srgb, ${pdT.border} 40%, transparent);
  border-left: 3px solid ${pdT.brandBold};
  box-sizing: border-box;
`

function statusLabel(status: IssueStatusKind): string {
  if (status === 'in_review') return 'IN-REVIEW'
  if (status === 'resolved') return 'RESOLVED'
  return 'ACTIVE'
}

function formatApiStatusLabel(statusRaw: string): string {
  const s = (statusRaw ?? '').trim()
  if (!s) return '—'
  return s
    .replaceAll(/[_-]+/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function statusBadgeProps(status: IssueStatusKind): {
  variant: 'secondary' | 'primary' | 'neutral'
  outlined: boolean
} {
  if (status === 'in_review') return { variant: 'primary', outlined: true }
  if (status === 'resolved') return { variant: 'neutral', outlined: true }
  return { variant: 'secondary', outlined: true }
}

function issueDetailContent(issue: ProjectIssueItem) {
  return (
    <DetailGrid>
      <Stack gap="600">
        <Stack gap="200" align="flex-start" fullWidth>
          <Text
            as="span"
            variant="caption2"
            color="color.text.subtle"
            style={{ ...kicker, margin: 0 }}
          >
            TECHNICAL OWNER
          </Text>
          <Inline align="center" gap="200" wrap={false}>
            <Avatar
              variant="initials"
              name={issue.owner.name}
              size="large"
              shape="circle"
            />
            <Stack gap="050" align="flex-start">
              <Text
                as="span"
                variant="body3"
                color="color.text.DEFAULT"
                style={{ margin: 0, fontWeight: 700 }}
              >
                {issue.owner.name}
              </Text>
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={{ ...kicker, margin: 0, opacity: 0.9 }}
              >
                {issue.owner.title}
              </Text>
            </Stack>
          </Inline>
        </Stack>

        <Stack gap="200" align="flex-start" fullWidth>
          <Text
            as="span"
            variant="caption2"
            color="color.text.subtle"
            style={{ ...kicker, margin: 0 }}
          >
            LINKED ASSETS
          </Text>
          <Inline wrap gap="100">
            {issue.linkedAssets.map((a) => (
              <DsTag
                key={a}
                variant="neutral"
                size="small"
                label={a}
                style={{
                  fontSize: 9,
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              />
            ))}
          </Inline>
        </Stack>
      </Stack>
      <Stack gap="200" align="flex-start" fullWidth>
        <Text
          as="span"
          variant="caption2"
          color="color.text.subtle"
          style={{ ...kicker, margin: 0 }}
        >
          LINKED SUB-ISSUES
        </Text>
        {issue.subIssues.length === 0 ? (
          <Text
            as="span"
            variant="body4"
            color="color.text.subtle"
            style={{ margin: 0 }}
          >
            No linked sub-issues.
          </Text>
        ) : (
          <SubIssueList>
            {issue.subIssues.map((s) => (
              <SubIssueCard key={s.id} role="group" aria-label={s.title}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Stack gap="050" align="flex-start" fullWidth>
                    <Text
                      as="span"
                      variant="caption2"
                      style={{
                        margin: 0,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        color: pdT.brandBold,
                      }}
                    >
                      {s.id}
                    </Text>
                    <Text
                      as="span"
                      variant="body4"
                      color="color.text.DEFAULT"
                      style={{ margin: 0, fontWeight: 600, lineHeight: 1.45 }}
                    >
                      {s.title}
                    </Text>
                  </Stack>
                </div>
                <ChevronRight
                  size={18}
                  strokeWidth={2}
                  color={pdT.textSubtle}
                  aria-hidden
                  style={{ flexShrink: 0 }}
                />
              </SubIssueCard>
            ))}
          </SubIssueList>
        )}
      </Stack>
    </DetailGrid>
  )
}

function toAccordionItems(
  issues: readonly ProjectIssueItem[]
): AccordionItem[] {
  return issues.map((issue) => {
    const sb = statusBadgeProps(issue.status)
    return {
      id: issue.id,
      identityChip: issue.code,
      title: issue.title,
      meta: issue.dueDateLabel,
      metadataTone: issue.metadataTone,
      trailing: (
        <Badge
          label={issue.statusLabel ?? statusLabel(issue.status)}
          size="small"
          variant={sb.variant}
          outlined={sb.outlined}
          style={{ flexShrink: 0, fontSize: 9, letterSpacing: '0.12em' }}
        />
      ),
      content: issueDetailContent(issue),
    }
  })
}

function mapApiStatus(statusRaw: string): IssueStatusKind {
  const s = statusRaw.toLowerCase()
  if (s.includes('review')) return 'in_review'
  if (s.includes('resolved') || s.includes('done') || s.includes('closed'))
    return 'resolved'
  return 'active'
}

function toneForStatus(
  status: IssueStatusKind
): ProjectIssueItem['metadataTone'] {
  if (status === 'active') return 'active'
  return 'neutral'
}

function formatDueLabel(dateIso: string): string {
  const d = new Date(dateIso)
  if (Number.isNaN(d.getTime())) return dateIso
  return d
    .toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    .toUpperCase()
}

function toUiIssue(
  row: ApiProjectIssueListItem
): ProjectIssueItem & { _parentIssueId: string | null } {
  const status = mapApiStatus(row.status)
  return {
    id: row.id,
    // Show the API issue id in the list (not a generated UI code).
    code: row.id,
    title: row.title,
    dueDateLabel: formatDueLabel(row.date),
    status,
    statusLabel: formatApiStatusLabel(row.status),
    metadataTone: toneForStatus(status),
    owner: {
      name: row.assignee?.name ?? 'Unassigned',
      title: row.assignee ? 'ASSIGNEE' : 'UNASSIGNED',
    },
    linkedAssets: [],
    subIssues: [],
    _parentIssueId: row.parentIssueId ?? null,
  }
}

export function ProjectIssuesTab() {
  const { projectId } = useParams<{ projectId: string }>()
  const issuesQuery = useProjectIssues(projectId, 'all')
  const apiUiIssues = useMemo(() => {
    const rows = issuesQuery.data ?? []
    const all = rows.map((row) => toUiIssue(row))

    const byId = new Map<
      string,
      ProjectIssueItem & { _parentIssueId: string | null }
    >()
    for (const it of all) byId.set(it.id, it)

    for (const it of all) {
      if (!it._parentIssueId) continue
      const parent = byId.get(it._parentIssueId)
      if (!parent) continue
      parent.subIssues.push({ id: it.id, title: it.title })
    }

    return all.filter((it) => {
      const pid = it._parentIssueId
      if (!pid) return true
      return !byId.has(pid)
    })
  }, [issuesQuery.data])

  const summary = useMemo(() => {
    const critical = apiUiIssues.filter(
      (i) => i.metadataTone === 'critical'
    ).length
    const active = apiUiIssues.filter((i) => i.status === 'active').length
    const pending = apiUiIssues.filter((i) => i.status === 'in_review').length
    return [
      {
        id: 'critical',
        label: 'CRITICAL',
        value: String(critical).padStart(2, '0'),
        emphasize: true as const,
      },
      {
        id: 'active',
        label: 'ACTIVE',
        value: String(active).padStart(2, '0'),
        emphasize: false as const,
      },
      {
        id: 'pending',
        label: 'PENDING REVIEW',
        value: String(pending).padStart(2, '0'),
        emphasize: true as const,
      },
    ]
  }, [apiUiIssues])

  const listColumns = useMemo(
    () => ['ID', 'ISSUE TITLE', 'DUE DATE', 'STATUS'] as const,
    []
  )

  const items = useMemo(() => toAccordionItems(apiUiIssues), [apiUiIssues])
  const defaultOpen = useMemo(() => apiUiIssues[0]?.id, [apiUiIssues])
  const [expandedIds, setExpandedIds] = useState<string[]>(() =>
    defaultOpen ? [defaultOpen] : []
  )

  return (
    <Stack gap="400" fullWidth>
      <SummaryGrid>
        {summary.map((s) => (
          <SummaryCard key={s.id} aria-label={`${s.label}: ${s.value}`}>
            <Stack gap="100" align="flex-start">
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={{ ...kicker, margin: 0 }}
              >
                {s.label}
              </Text>
              <Text
                as="span"
                variant="heading3"
                style={{
                  margin: 0,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: s.emphasize ? pdT.brandBold : pdT.pageFg,
                  fontSize: s.emphasize ? '2rem' : '1.75rem',
                }}
              >
                {s.value}
              </Text>
            </Stack>
          </SummaryCard>
        ))}
      </SummaryGrid>

      <ListShell>
        <ColumnHeader aria-hidden>
          <ColumnLabel>{listColumns[0]}</ColumnLabel>
          <ColumnLabel>{listColumns[1]}</ColumnLabel>
          <ColumnLabel style={{ textAlign: 'right' }}>
            {listColumns[2]}
          </ColumnLabel>
          <ColumnLabel style={{ textAlign: 'right' }}>
            {listColumns[3]}
          </ColumnLabel>
        </ColumnHeader>
        {issuesQuery.isLoading ? (
          <div style={{ padding: `${pdT.space300} ${pdT.space200}` }}>
            <Text as="span" variant="body4" color="color.text.subtle">
              Loading issues…
            </Text>
          </div>
        ) : apiUiIssues.length === 0 ? (
          <div style={{ padding: `${pdT.space300} ${pdT.space200}` }}>
            <Text as="span" variant="body4" color="color.text.subtle">
              No issues found for this project.
            </Text>
          </div>
        ) : null}
        <Accordion
          variant="metadata"
          size="medium"
          items={items}
          expandedIds={expandedIds}
          onToggle={(id, expanded) => {
            setExpandedIds((prev) =>
              expanded ? [...prev, id] : prev.filter((x) => x !== id)
            )
          }}
        />
      </ListShell>
    </Stack>
  )
}
