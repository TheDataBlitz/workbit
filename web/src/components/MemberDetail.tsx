import { Avatar } from '@thedatablitz/avatar'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import styled from 'styled-components'
import { pdT } from '../pages/project-detail/pdTokens'

export type MemberDetailMember = {
  id: string
  name: string
  username?: string
  avatarSrc?: string
  role?: string
  subtitle?: string
}

const Section = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: ${pdT.space300};
  background: ${pdT.surfaceOverlay};
  border: 1px solid color-mix(in srgb, ${pdT.border} 25%, transparent);
`

export function MemberDetail({ member }: { member: MemberDetailMember }) {
  const secondary = member.username?.trim()
    ? `@${member.username}`
    : [member.role, member.subtitle].filter(Boolean).join(' • ') || '—'

  return (
    <Stack gap="200" fullWidth>
      <Section>
        <Inline align="center" gap="200" wrap={false}>
          <Avatar
            variant="initials"
            name={member.name}
            size="xlarge"
            shape="circle"
          />
          <Stack gap="050" align="flex-start">
            <Text
              as="h3"
              variant="heading5"
              color="color.text.DEFAULT"
              style={{ margin: 0, fontWeight: 800 }}
            >
              {member.name}
            </Text>
            <Text
              as="p"
              variant="body3"
              color="color.text.subtle"
              style={{ margin: 0 }}
            >
              {secondary}
            </Text>
          </Stack>
        </Inline>
      </Section>

      <Stack gap="100" fullWidth>
        <Text
          as="span"
          variant="caption2"
          color="color.text.subtle"
          style={{
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 700,
            opacity: 0.65,
          }}
        >
          Member details
        </Text>
        <Text
          as="p"
          variant="body4"
          color="color.text.subtle"
          style={{ margin: 0, lineHeight: 1.6 }}
        >
          This panel is ready to be extended with activity, ownership, contact,
          and permissions as the API exposes them.
        </Text>
      </Stack>
    </Stack>
  )
}
