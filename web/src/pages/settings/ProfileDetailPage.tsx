import { Badge } from '@thedatablitz/badge'
import { Card } from '@thedatablitz/card'
import { Button } from '@thedatablitz/button'
import { Avatar } from '@thedatablitz/avatar'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Tag } from '@thedatablitz/tags'
import { Text } from '@thedatablitz/text'
import {
  Fingerprint,
  GripVertical,
  IdCard,
  Mail,
  Network,
  Pencil,
  Plus,
  Shield,
  Sparkles,
} from 'lucide-react'
import {
  useState,
  type ComponentType,
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import type { LucideIcon } from 'lucide-react'
import styled from 'styled-components'
import { itT } from './integrationTokens'
import { SettingsSubpageMain } from './settingsSubpageChrome'

const BaseSettingCard = Card as unknown as ComponentType<
  PropsWithChildren<{
    variant: 'base'
    borderTone?: 'none' | 'accent' | 'interactive'
    className?: string
    style?: CSSProperties
  }>
>

const AVATAR_SRC =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC-t0wPH1D_L3o8Nv5eG3ubSnwVdnwFfBp8_uPCcguEbzigPEYgc5Ufiwkb8Aw9-QNo8fHYDcoIfaACjTLNOSaGNDpO3jewsuH5cbjwo42WZT9EK3q6iD4ZaKFjbsmpO0blQBwg3-1Gj1rqgsgne39g94QOF2si5zVky-bHAe_t6mK2fTaHTx_kPT0DfH98tNpS7PkqyB2znKMXUoyo9wZhaEFS_1ykdN4rdGNf_lgtZEouGOqeR7SYHS0Ft6ydCx1I5tTF1E0-FWnh'

const ProfileMain = styled(SettingsSubpageMain)`
  background: #0a0a0a;
`

const PageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${itT('space.300')};
  align-items: start;

  @media (min-width: 1024px) {
    grid-template-columns: 1fr 2fr;
  }
`

const RightGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${itT('space.300')};

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const SpanFull = styled.div`
  @media (min-width: 768px) {
    grid-column: 1 / -1;
  }
`

const WidgetHeader = styled.div<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${itT('space.200')};
  border-bottom: 1px solid
    ${(p) =>
      p.$danger ? 'rgba(255, 180, 171, 0.12)' : 'rgba(164, 140, 130, 0.1)'};
  background: ${(p) =>
    p.$danger ? 'rgba(255, 180, 171, 0.05)' : 'rgba(32, 31, 31, 0.3)'};
`

const WidgetBody = styled.div`
  padding: ${itT('space.400')};
`

const CoreFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem 3rem;
`

const NamePairGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`

const SecurityRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: stretch;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`

const DeactivateButton = styled(Button)`
  flex-shrink: 0;
  color: #ffb4ab !important;
  border-color: rgba(255, 180, 171, 0.4) !important;

  &:hover {
    background: rgba(255, 180, 171, 0.08) !important;
  }
`

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        display: 'block',
        marginBottom: itT('space.100'),
      }}
    >
      <Text
        as="span"
        variant="caption2"
        color="color.text.subtle"
        style={{
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontWeight: 700,
        }}
      >
        {children}
      </Text>
    </label>
  )
}

/** Token-aligned field control (use `@thedatablitz/text-input` when registry auth is available). */
const FieldInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  background: ${itT('color.background.neutral.DEFAULT')};
  border: 1px solid rgba(164, 140, 130, 0.2);
  color: ${itT('color.text.DEFAULT')};
  padding: ${itT('space.300')} ${itT('space.300')};
  font-size: 1rem;
  font-weight: 500;
  font-family: inherit;
  outline: none;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;

  &:focus {
    border-color: #000;
    box-shadow: 0 0 0 1px #000;
  }

  &::placeholder {
    color: ${itT('color.text.disabled')};
  }
`

const FieldSelect = styled.select`
  width: 100%;
  box-sizing: border-box;
  background: ${itT('color.background.neutral.DEFAULT')};
  border: 1px solid rgba(164, 140, 130, 0.2);
  color: ${itT('color.text.DEFAULT')};
  padding: ${itT('space.200')} ${itT('space.200')};
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: #000;
    box-shadow: 0 0 0 1px #000;
  }
`

const EmailInputWrap = styled.div`
  position: relative;

  ${FieldInput} {
    padding-left: 2.75rem;
  }
`

const EmailIcon = styled(Mail)`
  position: absolute;
  left: ${itT('space.300')};
  top: 50%;
  transform: translateY(-50%);
  width: 1.25rem;
  height: 1.25rem;
  color: ${itT('color.icon.subtle')};
  pointer-events: none;
`

const AvatarWrap = styled.div`
  position: relative;
  margin-bottom: ${itT('space.400')};
`

const TierBadge = styled.div`
  position: absolute;
  top: -0.35rem;
  right: -0.35rem;
  z-index: 2;
`

const AvatarFrame = styled.div`
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid rgba(164, 140, 130, 0.12);
  background: #000;
`

const EditAvatarBtn = styled.button`
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${itT('space.150')};
  border: none;
  cursor: pointer;
  background: #000;
  color: ${itT('color.text.inverse')};

  & svg {
    color: inherit;
  }

  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.06);
  }
`

const SecurityPanel = styled.article`
  grid-column: 1 / -1;
  background: #1a1111;
  border: 1px solid rgba(255, 180, 171, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #22c55e;
  flex-shrink: 0;
`

function PanelTitle({
  title,
  icon: Icon,
  iconColor,
}: {
  title: string
  icon: LucideIcon
  iconColor?: string
}) {
  return (
    <Inline gap="100" align="center" wrap={false}>
      <Icon size={16} strokeWidth={2} aria-hidden color={iconColor ?? '#000'} />
      <Text
        as="span"
        variant="caption2"
        color="color.text.DEFAULT"
        style={{
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
    </Inline>
  )
}

export function ProfileDetailPage() {
  const [firstName, setFirstName] = useState('Alexander')
  const [lastName, setLastName] = useState('Vanguard')
  const [email, setEmail] = useState('a.vanguard@nexus-academy.edu')
  const [timezone, setTimezone] = useState('us-east')
  const [language, setLanguage] = useState('English (Academic), Mandarin')
  const [domains] = useState([
    'Machine Learning',
    'Ethical AI',
    'Curriculum Design',
  ])

  return (
    <>
      <ProfileMain>
        <PageGrid>
          <BaseSettingCard variant="base" borderTone="none">
            <WidgetHeader>
              <PanelTitle title="Identity Module" icon={Fingerprint} />
              <GripVertical
                size={14}
                color="rgba(164, 140, 130, 0.45)"
                aria-hidden
              />
            </WidgetHeader>
            <WidgetBody>
              <AvatarWrap>
                <TierBadge>
                  <Badge
                    label="Tier 04 Curator"
                    variant="secondary"
                    size="small"
                  />
                </TierBadge>
                <AvatarFrame>
                  <Avatar
                    variant="default"
                    shape="square"
                    size="xlarge"
                    src={AVATAR_SRC}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 0,
                      opacity: 0.85,
                    }}
                  />
                </AvatarFrame>
                <EditAvatarBtn type="button" aria-label="Edit profile photo">
                  <Pencil size={16} strokeWidth={2} aria-hidden />
                </EditAvatarBtn>
              </AvatarWrap>

              <Stack gap="300" fullWidth>
                <div
                  style={{
                    borderLeft: `2px solid rgba(255, 143, 92, 0.35)`,
                    paddingLeft: itT('space.200'),
                  }}
                >
                  <Text
                    as="p"
                    variant="caption2"
                    color="color.text.subtle"
                    style={{
                      margin: '0 0 0.25rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                    }}
                  >
                    System Descriptor
                  </Text>
                  <Text
                    as="p"
                    variant="heading5"
                    color="color.text.DEFAULT"
                    style={{
                      margin: 0,
                      fontWeight: 800,
                    }}
                  >
                    NX-4902-CUR
                  </Text>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: itT('space.200'),
                  }}
                >
                  <div
                    style={{
                      padding: itT('space.200'),
                      background: 'rgba(14, 14, 14, 0.5)',
                      border: '1px solid rgba(164, 140, 130, 0.1)',
                    }}
                  >
                    <Text
                      as="p"
                      variant="caption2"
                      color="color.text.subtle"
                      style={{
                        margin: '0 0 0.25rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      Status
                    </Text>
                    <Inline gap="100" align="center" wrap={false}>
                      <StatusDot aria-hidden />
                      <Text
                        as="span"
                        variant="body3"
                        color="color.text.DEFAULT"
                        style={{
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#4ade80',
                        }}
                      >
                        Active
                      </Text>
                    </Inline>
                  </div>
                  <div
                    style={{
                      padding: itT('space.200'),
                      background: 'rgba(14, 14, 14, 0.5)',
                      border: '1px solid rgba(164, 140, 130, 0.1)',
                    }}
                  >
                    <Text
                      as="p"
                      variant="caption2"
                      color="color.text.subtle"
                      style={{
                        margin: '0 0 0.25rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      Auth Lvl
                    </Text>
                    <Text
                      as="p"
                      variant="body3"
                      color="color.text.DEFAULT"
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Level 07
                    </Text>
                  </div>
                </div>
              </Stack>
            </WidgetBody>
          </BaseSettingCard>

          <RightGrid>
            <SpanFull>
              <BaseSettingCard variant="base" borderTone="none">
                <WidgetHeader>
                  <PanelTitle title="Core Identity Data" icon={IdCard} />
                  <GripVertical
                    size={14}
                    color="rgba(164, 140, 130, 0.45)"
                    aria-hidden
                  />
                </WidgetHeader>
                <WidgetBody>
                  <CoreFieldsGrid>
                    <NamePairGrid>
                      <Stack gap="100" fullWidth>
                        <FieldLabel htmlFor="profile-first">
                          First name
                        </FieldLabel>
                        <FieldInput
                          id="profile-first"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          autoComplete="given-name"
                        />
                      </Stack>
                      <Stack gap="100" fullWidth>
                        <FieldLabel htmlFor="profile-last">
                          Last name
                        </FieldLabel>
                        <FieldInput
                          id="profile-last"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          autoComplete="family-name"
                        />
                      </Stack>
                    </NamePairGrid>
                    <Stack gap="100" fullWidth>
                      <FieldLabel htmlFor="profile-email">
                        Institutional email
                      </FieldLabel>
                      <EmailInputWrap>
                        <EmailIcon aria-hidden />
                        <FieldInput
                          id="profile-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete="email"
                        />
                      </EmailInputWrap>
                    </Stack>
                  </CoreFieldsGrid>
                </WidgetBody>
              </BaseSettingCard>
            </SpanFull>

            <BaseSettingCard variant="base" borderTone="none">
              <WidgetHeader>
                <PanelTitle title="Comm Hub" icon={Network} />
                <GripVertical
                  size={14}
                  color="rgba(164, 140, 130, 0.45)"
                  aria-hidden
                />
              </WidgetHeader>
              <WidgetBody>
                <Stack gap="400" fullWidth>
                  <Stack gap="100" fullWidth>
                    <FieldLabel htmlFor="profile-tz">Timezone</FieldLabel>
                    <FieldSelect
                      id="profile-tz"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="us-east">UTC -05:00 Eastern Time</option>
                      <option value="utc">UTC +00:00 Greenwich</option>
                      <option value="cet">UTC +01:00 Central European</option>
                    </FieldSelect>
                  </Stack>
                  <Stack gap="100" fullWidth>
                    <FieldLabel htmlFor="profile-lang">
                      Language matrix
                    </FieldLabel>
                    <FieldInput
                      id="profile-lang"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    />
                  </Stack>
                </Stack>
              </WidgetBody>
            </BaseSettingCard>

            <BaseSettingCard variant="base" borderTone="none">
              <WidgetHeader>
                <PanelTitle title="Preferences" icon={Sparkles} />
                <GripVertical
                  size={14}
                  color="rgba(164, 140, 130, 0.45)"
                  aria-hidden
                />
              </WidgetHeader>
              <WidgetBody>
                <Text
                  as="p"
                  variant="caption2"
                  color="color.text.subtle"
                  style={{
                    margin: '0 0 1rem',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                  }}
                >
                  Knowledge domains
                </Text>
                <Inline gap="100" wrap>
                  {domains.map((d) => (
                    <Tag key={d} label={d} variant="neutral" size="small" />
                  ))}
                  <Button
                    variant="ghost"
                    size="small"
                    icon={<Plus size={14} aria-hidden />}
                  >
                    Add
                  </Button>
                </Inline>
              </WidgetBody>
            </BaseSettingCard>

            <SecurityPanel>
              <WidgetHeader $danger>
                <PanelTitle
                  title="Security Protocols"
                  icon={Shield}
                  iconColor="#ffb4ab"
                />
                <GripVertical
                  size={14}
                  color="rgba(255, 180, 171, 0.35)"
                  aria-hidden
                />
              </WidgetHeader>
              <WidgetBody>
                <SecurityRow>
                  <div style={{ maxWidth: '28rem' }}>
                    <Text
                      as="h4"
                      variant="body3"
                      color="color.text.DEFAULT"
                      style={{
                        margin: '0 0 0.35rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontStyle: 'italic',
                      }}
                    >
                      Critical deactivation
                    </Text>
                    <Text
                      as="p"
                      variant="caption2"
                      color="color.text.subtle"
                      style={{ margin: 0, lineHeight: 1.5 }}
                    >
                      Revoke all academic credentials and disconnect from
                      Intellebit clusters. This action is irreversible.
                    </Text>
                  </div>
                  <DeactivateButton variant="outline" size="medium">
                    Initialize deactivation
                  </DeactivateButton>
                </SecurityRow>
              </WidgetBody>
            </SecurityPanel>
          </RightGrid>
        </PageGrid>
      </ProfileMain>
    </>
  )
}
