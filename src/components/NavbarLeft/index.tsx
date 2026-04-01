import { Bell, LogOut } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { IconButton, Search, Avatar } from '@design-system'

import { useAuth } from '../../pages/auth/AuthContext'
import { WorkspaceDropdown } from '../WorkspaceDropdown'
import { NotificationWrapper } from './styles'
import type { NavbarLeftProps, NavbarRightProps } from './types'
import { shouldShowNotifications } from './utils/notifications'

export function NavbarLeft({
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
}: NavbarLeftProps) {
  return (
    <>
      <WorkspaceDropdown
        workspaces={workspaces}
        selectedWorkspace={currentWorkspace}
        onSelect={onSelectWorkspace}
      />
      <Search
        variant="expandable"
        placeholder="Search issues, projects, members..."
        expandedWidth={280}
      />
    </>
  )
}

export function NavbarRight({ workspaceId }: NavbarRightProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const hasNotifications = shouldShowNotifications()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <NotificationWrapper>
      {hasNotifications && (
        <IconButton
          aria-label="Notifications"
          onClick={() =>
            navigate(`/workspace/${workspaceId}/workspace/projects`)
          }
        >
          <Bell size={18} />
        </IconButton>
      )}
      <Link
        to={`/workspace/${workspaceId}/profile`}
        aria-label="Go to profile"
        style={{ display: 'flex', cursor: 'pointer' }}
      >
        <Avatar name="User" size={24} />
      </Link>
      <IconButton aria-label="Log out" onClick={handleLogout}>
        <LogOut size={18} />
      </IconButton>
    </NotificationWrapper>
  )
}
