import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  FileText,
  Folder,
  ArrowLeft,
  KeyRound,
  User,
  BarChart3,
  Settings2,
  Users,
  UsersRound,
} from 'lucide-react'

import { Avatar } from '@thedatablitz/avatar'
import { Box } from '@thedatablitz/box'
import { Dropdown } from '@thedatablitz/dropdown'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Tree, type TreeNode } from '@thedatablitz/tree'
import { cn } from '../../utils/cn'

import { navClasses } from './styles/classes'
import type { NavItemProps, SidebarNavProps } from './types'
import {
  getActiveProfileTab,
  getSelectedNavTreeId,
  isTeamIssues,
  isTeamProjects,
} from './utils/routeHelpers'

function NavItem({ to, active, children, collapsed, shortcut }: NavItemProps) {
  const linkClass = cn(
    navClasses.navItemBase,
    collapsed && navClasses.navItemCollapsed,
    active ? navClasses.navItemActive : navClasses.navItemInactive
  )

  if (collapsed) {
    return (
      <Link
        to={to}
        className={linkClass}
        aria-current={active ? 'page' : undefined}
      >
        {children}
      </Link>
    )
  }

  return (
    <Link
      to={to}
      className={linkClass}
      aria-current={active ? 'page' : undefined}
    >
      <Inline align="center" gap="100" fullWidth>
        {children}
        {shortcut ? (
          <Text as="span" variant="caption2" color="color.text.subtle">
            {shortcut}
          </Text>
        ) : null}
      </Inline>
    </Link>
  )
}

export function SidebarNav({
  workspaceId,
  teams,
  collapsed = false,
}: SidebarNavProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const base = `/workspace/${workspaceId}`
  const isProfileRoute = location.pathname.startsWith(`${base}/profile`)
  const activeProfileTab = getActiveProfileTab(location.search)
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    teams[0]?.id ?? ''
  )
  const activeTeamIdFromRoute = useMemo(() => {
    const match = new RegExp(`^${base}/team/([^/]+)(?:/|$)`).exec(
      location.pathname
    )
    return match?.[1] ?? null
  }, [base, location.pathname])

  useEffect(() => {
    if (teams.length === 0) {
      if (selectedTeamId !== '') setSelectedTeamId('')
      return
    }
    if (
      activeTeamIdFromRoute &&
      teams.some((team) => team.id === activeTeamIdFromRoute) &&
      selectedTeamId !== activeTeamIdFromRoute
    ) {
      setSelectedTeamId(activeTeamIdFromRoute)
      return
    }
    if (!teams.some((team) => team.id === selectedTeamId)) {
      setSelectedTeamId(teams[0].id)
    }
  }, [activeTeamIdFromRoute, selectedTeamId, teams])

  const navPaths = useMemo(() => {
    const paths: Record<string, string> = {
      'ws-projects': `${base}/workspace/projects`,
      'ws-members': `${base}/workspace/member`,
      'ws-teams': `${base}/workspace/teams`,
    }
    return paths
  }, [base])

  const sidebarTreeNodes = useMemo((): TreeNode[] => {
    const workspaceChildren: TreeNode[] = [
      {
        id: 'ws-projects',
        label: (
          <Inline align="center" gap="100" fullWidth className="min-w-0">
            <Folder size={15} className="shrink-0" />
            <Text as="span" variant="body3" truncate className="min-w-0 flex-1">
              Projects
            </Text>
          </Inline>
        ),
      },
      {
        id: 'ws-members',
        label: (
          <Inline align="center" gap="100" fullWidth className="min-w-0">
            <Users size={15} className="shrink-0" />
            <Text as="span" variant="body3" truncate className="min-w-0 flex-1">
              Members
            </Text>
          </Inline>
        ),
      },
      {
        id: 'ws-teams',
        label: (
          <Inline align="center" gap="100" fullWidth className="min-w-0">
            <UsersRound size={15} className="shrink-0" />
            <Text as="span" variant="body3" truncate className="min-w-0 flex-1">
              Teams
            </Text>
          </Inline>
        ),
      },
    ]

    const roots: TreeNode[] = [
      {
        id: 'sec-workspace',
        label: (
          <Box>
            <Text
              as="span"
              variant="caption1"
              color="color.text.subtle"
              className="font-semibold uppercase tracking-wide"
            >
              Workspace
            </Text>
          </Box>
        ),
        children: workspaceChildren,
      },
    ]
    return roots
  }, [])

  const expandedTreeIds = useMemo(() => {
    const ids: string[] = []
    if (workspaceOpen) ids.push('sec-workspace')
    return ids
  }, [workspaceOpen])

  const selectedTreeId = getSelectedNavTreeId(location.pathname, base, [])
  const selectedTreeIds = selectedTreeId ? [selectedTreeId] : []
  const activeTeamId = selectedTeamId || teams[0]?.id || ''

  const handleTreeToggle = (id: string, expanded: boolean) => {
    if (id === 'sec-workspace') setWorkspaceOpen(expanded)
  }

  const handleTreeSelect = (id: string) => {
    if (id === 'sec-workspace') {
      setWorkspaceOpen((o) => !o)
      return
    }
    const path = navPaths[id]
    if (path) navigate(path)
  }

  if (isProfileRoute && collapsed) {
    return (
      <Stack gap="050" padding="050" className="px-1">
        <Link
          to={`${base}/workspace/projects`}
          className={cn(
            navClasses.navItemBase,
            navClasses.navItemCollapsed,
            navClasses.navItemInactive
          )}
        >
          <ArrowLeft size={15} className="shrink-0" />
          <span>Back</span>
        </Link>
        <Link
          to={`${base}/profile?tab=profile`}
          className={cn(
            navClasses.navItemBase,
            navClasses.navItemCollapsed,
            activeProfileTab === 'profile'
              ? navClasses.navItemActive
              : navClasses.navItemInactive
          )}
          aria-current={activeProfileTab === 'profile' ? 'page' : undefined}
        >
          <User size={15} className="shrink-0" />
          <span>Profile</span>
        </Link>
        <Link
          to={`${base}/profile?tab=api-keys`}
          className={cn(
            navClasses.navItemBase,
            navClasses.navItemCollapsed,
            activeProfileTab === 'api-keys'
              ? navClasses.navItemActive
              : navClasses.navItemInactive
          )}
          aria-current={activeProfileTab === 'api-keys' ? 'page' : undefined}
        >
          <KeyRound size={15} className="shrink-0" />
          <span>API keys</span>
        </Link>
        <Link
          to={`${base}/profile?tab=usage`}
          className={cn(
            navClasses.navItemBase,
            navClasses.navItemCollapsed,
            activeProfileTab === 'usage'
              ? navClasses.navItemActive
              : navClasses.navItemInactive
          )}
          aria-current={activeProfileTab === 'usage' ? 'page' : undefined}
        >
          <BarChart3 size={15} className="shrink-0" />
          <span>Usage</span>
        </Link>
      </Stack>
    )
  }

  if (collapsed) {
    return (
      <Stack gap="050" padding="050" className="px-1">
        <Link
          to={`${base}/workspace/projects`}
          className={cn(
            navClasses.navItemBase,
            navClasses.navItemCollapsed,
            location.pathname === `${base}/workspace/projects`
              ? navClasses.navItemActive
              : navClasses.navItemInactive
          )}
          aria-current={
            location.pathname === `${base}/workspace/projects`
              ? 'page'
              : undefined
          }
        >
          <Folder size={15} className="shrink-0" />
          <span>Projects</span>
        </Link>
        <Link
          to={`${base}/workspace/projects`}
          className={cn(
            navClasses.navItemBase,
            navClasses.navItemCollapsed,
            location.pathname === `${base}/workspace/projects`
              ? navClasses.navItemActive
              : navClasses.navItemInactive
          )}
          aria-current={
            location.pathname === `${base}/workspace/projects`
              ? 'page'
              : undefined
          }
        >
          <Folder size={15} className="shrink-0" />
          <span>Projects</span>
        </Link>
        {teams.map((team) => (
          <Link
            key={team.id}
            to={`${base}/team/${team.id}/issues/active`}
            className={cn(
              'flex items-center justify-center px-1 py-1 rounded-md transition-colors',
              isTeamIssues(base, team.id, location.pathname)
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
            aria-label={team.name}
            title={team.name}
          >
            <Avatar name={team.name} size="small" />
          </Link>
        ))}
      </Stack>
    )
  }

  if (isProfileRoute) {
    return (
      <Stack gap="200" className="px-2">
        <Link
          to={`${base}/workspace/projects`}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft size={15} className="shrink-0" />
          <Text as="span" variant="body3" color="color.text.DEFAULT">
            Back to workspace
          </Text>
        </Link>

        <Box className="my-1 border-t border-slate-200" />

        <Text
          as="div"
          variant="caption1"
          color="color.text.subtle"
          className="px-1 font-semibold uppercase tracking-wide"
        >
          Profile
        </Text>

        <Stack gap="050">
          <NavItem
            to={`${base}/profile?tab=profile`}
            active={activeProfileTab === 'profile'}
          >
            <User size={15} className="shrink-0" />
            <Text as="span" variant="body3" truncate>
              Account details
            </Text>
          </NavItem>
          <NavItem
            to={`${base}/profile?tab=api-keys`}
            active={activeProfileTab === 'api-keys'}
          >
            <KeyRound size={15} className="shrink-0" />
            <Text as="span" variant="body3" truncate>
              API keys
            </Text>
          </NavItem>
          <NavItem
            to={`${base}/profile?tab=usage`}
            active={activeProfileTab === 'usage'}
          >
            <BarChart3 size={15} className="shrink-0" />
            <Text as="span" variant="body3" truncate>
              Usage
            </Text>
          </NavItem>
          <NavItem
            to={`${base}/profile?tab=integrationbits`}
            active={activeProfileTab === 'integrationbits'}
          >
            <Settings2 size={15} className="shrink-0" />
            <Text as="span" variant="body3" truncate>
              IntegrationBits
            </Text>
          </NavItem>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack gap="200">
      <Tree
        size="small"
        variant="primary"
        className="min-w-0 w-full"
        style={{ minWidth: 0 }}
        nodes={sidebarTreeNodes}
        expandedIds={expandedTreeIds}
        selectedIds={selectedTreeIds}
        onToggle={handleTreeToggle}
        onSelect={handleTreeSelect}
      />
      <Box padding="100">
        {teams.length > 0 ? (
          <Stack gap="100" className="pt-1">
            <Text
              as="span"
              variant="caption1"
              color="color.text.subtle"
              className="px-1 font-semibold uppercase tracking-wide"
            >
              Your team
            </Text>
            <Dropdown
              value={activeTeamId}
              onChange={(value) => {
                setSelectedTeamId(value)
                navigate(`${base}/team/${value}/issues/active`)
              }}
              options={teams.map((team) => ({
                value: team.id,
                label: team.name,
              }))}
              selectionType="single"
              placeholder="Team"
              size="small"
            />
            <NavItem
              to={`${base}/team/${activeTeamId}/issues/active`}
              active={isTeamIssues(base, activeTeamId, location.pathname)}
            >
              <FileText size={13} className="shrink-0" />
              <Text
                as="span"
                variant="body3"
                truncate
                className="min-w-0 flex-1"
              >
                Issues
              </Text>
            </NavItem>
            <NavItem
              to={`${base}/team/${activeTeamId}/projects`}
              active={isTeamProjects(base, activeTeamId, location.pathname)}
            >
              <Folder size={13} className="shrink-0" />
              <Text
                as="span"
                variant="body3"
                truncate
                className="min-w-0 flex-1"
              >
                Projects
              </Text>
            </NavItem>
          </Stack>
        ) : null}
      </Box>
    </Stack>
  )
}
