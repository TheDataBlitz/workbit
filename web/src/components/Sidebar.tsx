import { ChevronLeft, ChevronRight, LogOut, Settings } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
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

const Aside = styled.aside<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  max-width: ${(p) => (p.$collapsed ? '5rem' : '20rem')};
  box-sizing: border-box;
  padding: ${(p) => (p.$collapsed ? '1.25rem 0.75rem' : '2rem 1.5rem')};
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

const CollapseToggleRow = styled.div<{ $collapsed: boolean }>`
  display: flex;
  flex-direction: ${(p) => (p.$collapsed ? 'column' : 'row')};
  align-items: ${(p) => (p.$collapsed ? 'center' : 'center')};
  justify-content: ${(p) => (p.$collapsed ? 'flex-start' : 'space-between')};
  gap: ${(p) => (p.$collapsed ? '0.5rem' : '0.75rem')};
`

const CollapseToggleButton = styled.button<{ $collapsed: boolean }>`
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid rgba(86, 67, 59, 0.18);
  background: rgba(28, 27, 27, 0.8);
  color: rgba(255, 255, 255, 0.78);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;

  &:hover {
    border-color: rgba(86, 67, 59, 0.28);
    background: rgba(42, 42, 42, 0.85);
  }

  &:focus-visible {
    outline: 2px solid rgba(255, 143, 92, 0.35);
    outline-offset: 2px;
  }
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

const ProjectGlyph = styled.div<{ $selected: boolean; $dimmed?: boolean }>`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 12px;
  border: 1px solid
    ${(p) =>
      p.$selected ? 'rgba(255, 143, 92, 0.55)' : 'rgba(86, 67, 59, 0.18)'};
  background: ${(p) =>
    p.$selected ? 'rgba(255, 143, 92, 0.08)' : 'rgba(28, 27, 27, 0.65)'};
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  opacity: ${(p) => (p.$dimmed ? 0.65 : 1)};
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
  onWorkspaceMembersClick?: () => void
  workspaceMembersActive?: boolean
  onSettingsClick?: () => void
  onSignOutClick?: () => void
  /** Collapsible desktop sidebar (overlay drawer is always expanded) */
  collapsible?: boolean
  /** Controlled collapsed state */
  collapsed?: boolean
  /** Initial collapsed state (used when `collapsed` is not provided) */
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** When set with `onBackdropClick`, renders mobile-style overlay + backdrop */
  overlayOpen?: boolean
  onBackdropClick?: () => void
  /** Optional content shown behind overlay (e.g. page shell) */
  children?: ReactNode
}

const defaultProjects: SidebarProject[] = []

const sidebarCollapsedStorageKey = 'workbit.sidebar.collapsed'

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
  onWorkspaceMembersClick,
  workspaceMembersActive = false,
  onSettingsClick,
  onSignOutClick,
  collapsible = true,
  collapsed,
  defaultCollapsed,
  onCollapsedChange,
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

  const [uncontrolledCollapsed, setUncontrolledCollapsed] = useState(() => {
    if (typeof collapsed === 'boolean') return collapsed
    if (typeof defaultCollapsed === 'boolean') return defaultCollapsed
    try {
      const raw = localStorage.getItem(sidebarCollapsedStorageKey)
      if (raw === '1') return true
      if (raw === '0') return false
    } catch {
      // ignore storage failures (e.g. privacy mode)
    }
    return false
  })

  const isOverlay = Boolean(overlayOpen && onBackdropClick)
  const effectiveCollapsed =
    isOverlay || !collapsible ? false : (collapsed ?? uncontrolledCollapsed)

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

  const workspaceOptionsCollapsed: DropdownOption[] = useMemo(
    () =>
      resolvedWorkspaces.map((w) => ({
        value: w.id,
        label: (
          <Inline align="center" gap="100" wrap={false}>
            <WorkspaceDot aria-hidden />
            <Text
              as="span"
              variant="caption1"
              style={{
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: c.primary,
              }}
            >
              {w.name?.trim()?.slice(0, 2) || 'WS'}
            </Text>
          </Inline>
        ),
      })),
    [resolvedWorkspaces]
  )

  const toggleCollapsed = () => {
    if (isOverlay || !collapsible) return
    const next = !(collapsed ?? uncontrolledCollapsed)
    if (typeof collapsed !== 'boolean') setUncontrolledCollapsed(next)
    onCollapsedChange?.(next)
    try {
      localStorage.setItem(sidebarCollapsedStorageKey, next ? '1' : '0')
    } catch {
      // ignore storage failures
    }
  }

  const drawer = (
    <Aside aria-label="Workbit navigation" $collapsed={effectiveCollapsed}>
      <ProfileBlock>
        <CollapseToggleRow $collapsed={effectiveCollapsed}>
          <ProfileRow>
            <Avatar
              src={userAvatarUrl}
              name={userName}
              alt=""
              variant="default"
              size={effectiveCollapsed ? 'small' : 'medium'}
              shape="square"
              style={{
                flexShrink: 0,
                filter: 'grayscale(1) contrast(1.25)',
              }}
            />
            {!effectiveCollapsed ? (
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
            ) : null}
          </ProfileRow>

          {collapsible && !isOverlay ? (
            <CollapseToggleButton
              type="button"
              onClick={toggleCollapsed}
              aria-label={
                effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
              title={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              $collapsed={effectiveCollapsed}
            >
              {effectiveCollapsed ? (
                <ChevronRight size={18} strokeWidth={2} aria-hidden />
              ) : (
                <ChevronLeft size={18} strokeWidth={2} aria-hidden />
              )}
            </CollapseToggleButton>
          ) : null}
        </CollapseToggleRow>
      </ProfileBlock>

      <WorkspaceSection>
        {!effectiveCollapsed ? (
          <>
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
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 96 }}>
              <Dropdown
                options={workspaceOptionsCollapsed}
                value={workspaceValue}
                onChange={(id) => onWorkspaceChange?.(id)}
                size="large"
                surface="mobile"
                chevronMode="split"
              />
            </div>
          </div>
        )}
      </WorkspaceSection>

      <div style={{ padding: effectiveCollapsed ? '0 0.25rem' : '0 0.5rem' }}>
        {!effectiveCollapsed ? (
          <Text
            as="span"
            variant="caption2"
            color="color.text.subtle"
            style={{ ...sectionLabelStyle, paddingLeft: '0.5rem' }}
          >
            Workspace
          </Text>
        ) : null}
        <Button
          variant={workspaceMembersActive ? 'secondary' : 'ghost'}
          size="medium"
          onClick={onWorkspaceMembersClick}
          aria-label="Members"
          title={effectiveCollapsed ? 'Members' : undefined}
          style={{
            width: '100%',
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
          }}
        >
          {effectiveCollapsed ? (
            <Text
              as="span"
              variant="caption1"
              color="color.text.subtle"
              style={{
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                opacity: 0.9,
              }}
            >
              M
            </Text>
          ) : (
            <Text
              as="span"
              variant="body3"
              color="color.text.DEFAULT"
              style={{ fontWeight: 650 }}
            >
              Members
            </Text>
          )}
        </Button>
      </div>

      <ProjectScroll>
        {!effectiveCollapsed ? (
          <Text
            as="span"
            variant="caption2"
            color="color.text.subtle"
            style={{ ...sectionLabelStyle, paddingLeft: '1rem' }}
          >
            Projects
          </Text>
        ) : null}
        {projects.length === 0 ? (
          !effectiveCollapsed ? (
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
          ) : (
            <div
              style={{
                paddingTop: '0.5rem',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Text
                as="span"
                variant="caption2"
                color="color.text.subtle"
                style={{ opacity: 0.6, letterSpacing: '0.12em' }}
              >
                —
              </Text>
            </div>
          )
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
              aria-label={p.name}
              title={effectiveCollapsed ? p.name : undefined}
              style={{
                width: '100%',
                justifyContent: effectiveCollapsed ? 'center' : 'space-between',
                opacity: p.dimmed ? 0.6 : 1,
              }}
            >
              {!effectiveCollapsed ? (
                <>
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
                </>
              ) : (
                <ProjectGlyph $selected={isSelected} $dimmed={p.dimmed}>
                  <Text
                    as="span"
                    variant="caption1"
                    color={
                      isSelected ? 'color.text.DEFAULT' : 'color.text.subtle'
                    }
                    style={{
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      opacity: p.dimmed ? 0.7 : 0.9,
                    }}
                  >
                    {(p.name?.trim()?.[0] ?? '•').toUpperCase()}
                  </Text>
                </ProjectGlyph>
              )}
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
          aria-label="Settings"
          style={{
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontSize: 12,
          }}
        >
          {effectiveCollapsed ? null : 'Settings'}
        </Button>
        <Button
          variant="link"
          size="small"
          icon={<LogOut size={18} strokeWidth={2} aria-hidden />}
          onClick={onSignOutClick}
          aria-label="Sign Out"
          style={{
            justifyContent: effectiveCollapsed ? 'center' : 'flex-start',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontSize: 12,
          }}
        >
          {effectiveCollapsed ? null : 'Sign Out'}
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
