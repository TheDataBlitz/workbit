import { LogOut, Settings } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import styled from 'styled-components'
import { Avatar } from '@thedatablitz/avatar'
import { Button } from '@thedatablitz/button'
import { Dropdown, type DropdownOption } from '@thedatablitz/dropdown'
import { Inline } from '@thedatablitz/inline'
import { Text } from '@thedatablitz/text'

/** Accent colors not covered by `Text` token colors for this shell */
const c = {
  bg: '#131313',
  surfaceLow: '#1c1b1b',
  surfaceHigh: '#2a2a2a',
  primary: '#ff8f5c',
  tertiaryDot: '#ec9969',
  outline: '#a48c82',
  outlineVariant: '#56433b',
}

const Aside = styled.aside`
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  max-width: 20rem;
  box-sizing: border-box;
  padding: 2rem 1.5rem;
  gap: 1rem;
  overflow: hidden;
  background: ${c.bg};
  border-right: 1px solid rgba(86, 67, 59, 0.1);
  box-shadow: 40px 0 60px rgba(229, 226, 225, 0.05);
`

const ProfileBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
`

const ProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`

const ProfileText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`

const WorkspaceSection = styled.div`
  position: relative;
  margin-bottom: 0.25rem;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: ${c.outlineVariant};
    opacity: 0.2;
  }
`

const WorkspaceDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: ${c.primary};
  flex-shrink: 0;
`

const ProjectScroll = styled.div`
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: ${c.bg};
  }
  &::-webkit-scrollbar-thumb {
    background: ${c.surfaceHigh};
  }
`

const StatusWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

const StatusDot = styled.span<{
  $variant: 'active' | 'review' | 'archived'
}>`
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  flex-shrink: 0;
  background: ${(p) =>
    p.$variant === 'active'
      ? c.primary
      : p.$variant === 'review'
        ? c.tertiaryDot
        : c.outline};
`

const BottomActions = styled.div`
  padding-top: 1.5rem;
  margin-top: auto;
  flex-shrink: 0;
  border-top: 1px solid rgba(86, 67, 59, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: stretch;
`

const OverlayRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: stretch;
`

/** Prevents the drawer from growing on the row axis when using flex-based height fill */
const OverlayDrawerColumn = styled.div`
  flex: 0 0 20rem;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const Backdrop = styled.button`
  flex: 1;
  min-width: 0;
  border: none;
  padding: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
`

const sectionLabelStyle = {
  fontSize: 10,
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  opacity: 0.55,
  display: 'block' as const,
  marginBottom: '0.5rem',
}

export type SidebarProjectStatus = 'active' | 'in_review' | 'archived'

export type SidebarProject = {
  id: string
  name: string
  status: SidebarProjectStatus
  /** Archived-style muted row */
  dimmed?: boolean
}

export type SidebarWorkspace = {
  id: string
  name: string
}

export type SidebarProps = {
  userName?: string
  userTitle?: string
  userAvatarUrl?: string
  /** Shown when `workspaces` is omitted or empty */
  workspaceName?: string
  /** Workspace rows for the selector; defaults to a single entry from `workspaceName` */
  workspaces?: SidebarWorkspace[]
  selectedWorkspaceId?: string | null
  onWorkspaceChange?: (workspaceId: string) => void
  projects?: SidebarProject[]
  selectedProjectId?: string | null
  onProjectSelect?: (id: string) => void
  onSettingsClick?: () => void
  onSignOutClick?: () => void
  /** When set with `onBackdropClick`, renders mobile-style overlay + backdrop */
  overlayOpen?: boolean
  onBackdropClick?: () => void
  /** Optional content shown behind overlay (e.g. page shell) */
  children?: ReactNode
}

const defaultProjects: SidebarProject[] = []

function statusVariant(
  status: SidebarProjectStatus
): 'active' | 'review' | 'archived' {
  if (status === 'in_review') return 'review'
  if (status === 'archived') return 'archived'
  return 'active'
}

function statusLabelText(status: SidebarProjectStatus): string {
  if (status === 'active') return 'Active'
  if (status === 'in_review') return 'In Review'
  return 'Archived'
}

export function Sidebar({
  userName = 'Alex Rivers',
  userTitle = 'Premium Curator',
  userAvatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAiY44sGNbS0U3_BG4ZGi7-rD0dRcA94O7OhRRLNffQgLv5X0N-cLS62jLImSQfCojSt_RVtLJrKHx2jNgRUKIcP0rp1zqGx511QyvB84gvEMyG7KI0h3HrHGSEXc4F8Fa7EfQM30ZhAsGbLDhJkyDyaHcOargQLibJiNHgtZecwfzLtEgk7kR5i-VuOg4t9qVvhbaUhThhYaYhbjs-kelXpl_Prnf_aPMEODRgKgw-DFE6gzWzsFp9m8rYrX2T44AH3omZuIwrrHY-',
  workspaceName = 'No workspaces',
  workspaces,
  selectedWorkspaceId,
  onWorkspaceChange,
  projects = defaultProjects,
  selectedProjectId,
  onProjectSelect,
  onSettingsClick,
  onSignOutClick,
  overlayOpen,
  onBackdropClick,
  children,
}: SidebarProps) {
  const resolvedWorkspaces = useMemo((): SidebarWorkspace[] => {
    if (workspaces && workspaces.length > 0) return workspaces
    return [{ id: 'default', name: workspaceName }]
  }, [workspaces, workspaceName])

  const workspaceValue =
    selectedWorkspaceId ?? resolvedWorkspaces[0]?.id ?? 'default'

  const workspaceOptions: DropdownOption[] = useMemo(
    () =>
      resolvedWorkspaces.map((w) => ({
        value: w.id,
        label: (
          <Inline align="center" gap="100" wrap={false}>
            <WorkspaceDot aria-hidden />
            <Text
              as="span"
              variant="body3"
              style={{
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: c.primary,
              }}
            >
              {w.name}
            </Text>
          </Inline>
        ),
      })),
    [resolvedWorkspaces]
  )

  const drawer = (
    <Aside aria-label="Workbit navigation">
      <ProfileBlock>
        <ProfileRow>
          <Avatar
            src={userAvatarUrl}
            name={userName}
            alt=""
            variant="default"
            size="medium"
            shape="square"
            style={{
              flexShrink: 0,
              filter: 'grayscale(1) contrast(1.25)',
            }}
          />
          <ProfileText>
            <Text
              as="span"
              variant="heading6"
              color="color.text.DEFAULT"
              style={{ fontWeight: 800, letterSpacing: '-0.02em' }}
            >
              {userName}
            </Text>
            <Text
              as="span"
              variant="caption2"
              color="color.text.subtle"
              style={{
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {userTitle}
            </Text>
          </ProfileText>
        </ProfileRow>
      </ProfileBlock>

      <WorkspaceSection>
        <Text
          as="span"
          variant="caption2"
          color="color.text.subtle"
          style={sectionLabelStyle}
        >
          Workspace
        </Text>
        <Dropdown
          options={workspaceOptions}
          value={workspaceValue}
          onChange={(id) => onWorkspaceChange?.(id)}
          size="large"
          surface="mobile"
          chevronMode="split"
        />
      </WorkspaceSection>

      <ProjectScroll>
        <Text
          as="span"
          variant="caption2"
          color="color.text.subtle"
          style={{ ...sectionLabelStyle, paddingLeft: '1rem' }}
        >
          Projects
        </Text>
        {projects.length === 0 ? (
          <div style={{ padding: '0.75rem 1rem' }}>
            <Text
              as="span"
              variant="caption2"
              color="color.text.subtle"
              style={{ opacity: 0.7, letterSpacing: '0.06em' }}
            >
              No projects in this workspace.
            </Text>
          </div>
        ) : null}
        {projects.map((p) => {
          const isSelected = selectedProjectId === p.id
          const sv = statusVariant(p.status)
          const nameColor =
            isSelected || p.status === 'active'
              ? ('color.text.DEFAULT' as const)
              : p.dimmed || p.status === 'archived'
                ? ('color.text.disabled' as const)
                : ('color.text.subtle' as const)
          const nameStyle =
            !isSelected && p.status === 'in_review' && !p.dimmed
              ? { color: 'rgba(255, 255, 255, 0.7)' }
              : undefined

          const statusColorToken =
            sv === 'active'
              ? undefined
              : sv === 'review'
                ? ('color.text.subtle' as const)
                : ('color.text.disabled' as const)
          const statusStyle =
            sv === 'active'
              ? {
                  fontSize: 9,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                  color: c.primary,
                }
              : {
                  fontSize: 9,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                  opacity: sv === 'review' ? 0.55 : 0.45,
                }

          return (
            <Button
              key={p.id}
              variant="ghost"
              size="medium"
              onClick={() => onProjectSelect?.(p.id)}
              style={{
                width: '100%',
                justifyContent: 'space-between',
                opacity: p.dimmed ? 0.6 : 1,
              }}
            >
              <Text
                as="span"
                variant="body3"
                color={nameColor}
                style={{ ...nameStyle, fontWeight: 500 }}
              >
                {p.name}
              </Text>
              <StatusWrap>
                <Text
                  as="span"
                  variant="caption2"
                  color={statusColorToken}
                  style={statusStyle}
                >
                  {statusLabelText(p.status)}
                </Text>
                <StatusDot $variant={sv} aria-hidden />
              </StatusWrap>
            </Button>
          )
        })}
      </ProjectScroll>

      <BottomActions>
        <Button
          variant="link"
          size="small"
          icon={<Settings size={18} strokeWidth={2} aria-hidden />}
          onClick={onSettingsClick}
          style={{
            justifyContent: 'flex-start',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontSize: 12,
          }}
        >
          Settings
        </Button>
        <Button
          variant="link"
          size="small"
          icon={<LogOut size={18} strokeWidth={2} aria-hidden />}
          onClick={onSignOutClick}
          style={{
            justifyContent: 'flex-start',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontSize: 12,
          }}
        >
          Sign Out
        </Button>
      </BottomActions>
    </Aside>
  )

  if (overlayOpen && onBackdropClick) {
    return (
      <>
        <OverlayRoot>
          <OverlayDrawerColumn>{drawer}</OverlayDrawerColumn>
          <Backdrop
            type="button"
            aria-label="Close menu"
            onClick={onBackdropClick}
          />
        </OverlayRoot>
        {children}
      </>
    )
  }

  return drawer
}
