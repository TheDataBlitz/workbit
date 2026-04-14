import styled from 'styled-components'
import { Avatar } from '@thedatablitz/avatar'
import { Badge } from '@thedatablitz/badge'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Tag as DsTag } from '@thedatablitz/tags'
import { Text } from '@thedatablitz/text'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { pdT } from '../pdTokens'
import type { UpdateFeedItem } from '../projectUpdatesMock'
import { useProjectStatusUpdates } from '../hooks'

const Panel = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: ${pdT.space400};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`

const UpdatesLayout = styled.div`
  display: grid;
  gap: ${pdT.space400};
  grid-template-columns: 1fr;

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
    align-items: start;
  }
`

const FeedStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${pdT.space400};
  width: 100%;
  min-width: 0;
`

const SidebarStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${pdT.space400};
  width: 100%;
  min-width: 0;
`

const kicker = {
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  opacity: 0.65,
}

const metaCaps = {
  fontSize: 10,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  opacity: 0.55,
}

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: ${pdT.space200};

  &:not(:first-child) {
    padding-top: ${pdT.space200};
    margin-top: ${pdT.space200};
    border-top: 1px solid color-mix(in srgb, ${pdT.border} 40%, transparent);
  }
`

const AttachmentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${pdT.space200};
  margin-top: ${pdT.space300};
`

const AttachmentThumb = styled.div<{ $variant: 'infra' | 'code' }>`
  position: relative;
  min-height: 120px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, ${pdT.border} 45%, transparent);
  background: ${(p) =>
    p.$variant === 'infra'
      ? `linear-gradient(160deg, ${pdT.pageBg} 0%, ${pdT.neutralSubtle} 45%, #0d1f14 100%)`
      : `linear-gradient(145deg, #1a1a2e 0%, ${pdT.surfaceOverlay} 55%, #0f0f18 100%)`};
`

const AttachmentLabel = styled.span`
  position: absolute;
  bottom: ${pdT.space100};
  left: ${pdT.space100};
  right: ${pdT.space100};
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: ${pdT.pageFg};
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
`

function UpdateFeedCard({ item }: { item: UpdateFeedItem }) {
  const header = (
    <Inline justify="space-between" align="flex-start" gap="200" fullWidth wrap>
      <Inline align="center" gap="200" wrap={false}>
        <Avatar
          variant="initials"
          name={item.author.name}
          size="medium"
          shape="circle"
        />
        <Stack gap="025" align="flex-start">
          <Text
            as="span"
            variant="body3"
            color="color.text.DEFAULT"
            style={{ margin: 0, fontWeight: 700 }}
          >
            {item.author.name}
          </Text>
          <Text
            as="span"
            variant="caption2"
            color="color.text.subtle"
            style={{ ...metaCaps, margin: 0 }}
          >
            {item.author.role} • {item.author.time}
          </Text>
        </Stack>
      </Inline>
      <Badge
        variant={item.statusBadgeVariant}
        size="small"
        label={item.statusLabel}
        style={{ flexShrink: 0, fontSize: 9, letterSpacing: '0.12em' }}
      />
    </Inline>
  )

  if (item.kind === 'archived') {
    return (
      <Panel aria-label={`Update from ${item.author.name}`}>
        <Stack gap="300" fullWidth>
          {header}
          <Text
            as="p"
            variant="body3"
            color="color.text.subtle"
            style={{
              margin: 0,
              fontStyle: 'italic',
              lineHeight: 1.65,
              opacity: 0.9,
            }}
          >
            “{item.quoteBody}”
          </Text>
        </Stack>
      </Panel>
    )
  }

  const body = (
    <>
      <Text
        as="h3"
        variant="heading5"
        color="color.text.DEFAULT"
        style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em' }}
      >
        {item.title}
      </Text>
      <Text
        as="p"
        variant="body3"
        color="color.text.subtle"
        style={{ margin: 0, lineHeight: 1.65 }}
      >
        {item.body}
      </Text>
    </>
  )

  if (item.kind === 'completed') {
    return (
      <Panel aria-label={item.title}>
        <Stack gap="300" fullWidth>
          {header}
          {body}
          <Inline wrap gap="100">
            {item.tags.map((t) => (
              <DsTag
                key={t}
                variant="neutral"
                size="small"
                label={t}
                style={{
                  fontSize: 9,
                  letterSpacing: '0.04em',
                  fontWeight: 600,
                }}
              />
            ))}
          </Inline>
        </Stack>
      </Panel>
    )
  }

  return (
    <Panel aria-label={item.title}>
      <Stack gap="300" fullWidth>
        {header}
        {body}
        <AttachmentGrid>
          {item.attachments.map((a) => (
            <AttachmentThumb
              key={a.label}
              $variant={a.variant}
              role="img"
              aria-label={a.label}
            >
              <AttachmentLabel>{a.label}</AttachmentLabel>
            </AttachmentThumb>
          ))}
        </AttachmentGrid>
      </Stack>
    </Panel>
  )
}

function badgeVariantForStatus(
  status: string
): 'secondary' | 'warning' | 'neutral' {
  if (status === 'on-track') return 'secondary'
  if (status === 'at-risk') return 'warning'
  return 'neutral'
}

function labelForStatus(status: string): string {
  if (status === 'on-track') return 'ON TRACK'
  if (status === 'at-risk') return 'AT RISK'
  if (status === 'off-track') return 'OFF TRACK'
  return status.toUpperCase()
}

function timeAgoLabel(iso: string): string {
  const d = new Date(iso)
  const ms = d.getTime()
  if (!Number.isFinite(ms)) return '—'
  const diff = Date.now() - ms
  const min = Math.max(0, Math.floor(diff / 60000))
  if (min < 60) return `${min}M AGO`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}H AGO`
  const day = Math.floor(hr / 24)
  return `${day}D AGO`
}

export function ProjectUpdatesTab() {
  const { projectId } = useParams<{ projectId: string }>()
  const updatesQuery = useProjectStatusUpdates(projectId)

  const feed: UpdateFeedItem[] = useMemo(() => {
    const nodes = updatesQuery.data?.nodes ?? []
    return nodes.map((u) => {
      const statusLabel = labelForStatus(u.status)
      const statusBadgeVariant = badgeVariantForStatus(u.status)
      const title = statusLabel
      const body = u.content
      return {
        id: u.id,
        kind: 'completed',
        author: {
          name: u.author.name?.trim() ? u.author.name : 'Unknown',
          role: 'MEMBER',
          time: timeAgoLabel(u.createdAt),
        },
        statusLabel,
        statusBadgeVariant,
        title,
        body,
        tags: [],
      }
    })
  }, [updatesQuery.data])

  const contributors = useMemo(() => {
    const set = new Set(feed.map((f) => f.author.name))
    return set.size
  }, [feed])

  return (
    <UpdatesLayout>
      <FeedStack>
        {updatesQuery.isLoading ? (
          <Panel>
            <Text as="span" variant="body4" color="color.text.subtle">
              Loading updates…
            </Text>
          </Panel>
        ) : feed.length === 0 ? (
          <Panel>
            <Text as="span" variant="body4" color="color.text.subtle">
              No updates found for this project.
            </Text>
          </Panel>
        ) : (
          feed.map((item) => <UpdateFeedCard key={item.id} item={item} />)
        )}
      </FeedStack>

      <SidebarStack>
        <Panel aria-labelledby="pd-activity-insights">
          <Stack gap="200" fullWidth>
            <Text
              as="h2"
              variant="caption2"
              color="color.text.subtle"
              id="pd-activity-insights"
              style={{ ...kicker, margin: 0 }}
            >
              ACTIVITY INSIGHTS
            </Text>
            <Stack gap="0" fullWidth>
              <StatRow>
                <Text
                  as="span"
                  variant="caption2"
                  color="color.text.subtle"
                  style={{ ...metaCaps, margin: 0 }}
                >
                  TOTAL UPDATES
                </Text>
                <Text
                  as="span"
                  variant="heading5"
                  color="color.text.DEFAULT"
                  style={{ margin: 0, fontWeight: 800 }}
                >
                  {String(feed.length)}
                </Text>
              </StatRow>
              <StatRow>
                <Text
                  as="span"
                  variant="caption2"
                  color="color.text.subtle"
                  style={{ ...metaCaps, margin: 0 }}
                >
                  CONTRIBUTORS
                </Text>
                <Text
                  as="span"
                  variant="heading5"
                  color="color.text.DEFAULT"
                  style={{ margin: 0, fontWeight: 800 }}
                >
                  {String(contributors)}
                </Text>
              </StatRow>
            </Stack>
          </Stack>
        </Panel>
      </SidebarStack>
    </UpdatesLayout>
  )
}
