import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import styled from 'styled-components'
import { pdT } from '../pages/project-detail/pdTokens'

export type MemberListItem = {
  id: string
  name: string
  role?: string
  subtitle?: string
  avatarSrc?: string
}

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${pdT.space200};
  padding: ${pdT.space250} ${pdT.space250};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 30%, transparent);
`

const Avatar = styled.div<{ $src?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: ${(p) =>
    p.$src ? `url("${p.$src}") center/cover no-repeat` : pdT.surface};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
  flex: 0 0 auto;
`

export function MemberList({
  members,
  onMemberClick,
}: {
  members: MemberListItem[]
  onMemberClick?: (member: MemberListItem) => void
}) {
  return (
    <Stack gap="150" fullWidth>
      {members.map((m) => (
        <Row
          key={m.id}
          role={onMemberClick ? 'button' : undefined}
          tabIndex={onMemberClick ? 0 : undefined}
          onClick={onMemberClick ? () => onMemberClick(m) : undefined}
          onKeyDown={
            onMemberClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') onMemberClick(m)
                }
              : undefined
          }
          style={onMemberClick ? { cursor: 'pointer' } : undefined}
        >
          <Inline align="center" gap="150" wrap={false}>
            <Avatar $src={m.avatarSrc} aria-hidden />
            <Stack gap="025">
              <Text as="span" variant="body3" style={{ fontWeight: 750 }}>
                {m.name}
              </Text>
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={{ margin: 0, opacity: 0.85 }}
              >
                {[m.role, m.subtitle].filter(Boolean).join(' • ') || '—'}
              </Text>
            </Stack>
          </Inline>
        </Row>
      ))}
    </Stack>
  )
}
