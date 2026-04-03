import {
  useEffect,
  useState,
  type ComponentProps,
  type Dispatch,
  type FC,
  type SetStateAction,
} from 'react'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@thedatablitz/sidebar'
import { Modal } from '@thedatablitz/modal'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'

import { SidebarNav } from '../../components/SidebarNav'
import { SidebarNavFooter } from '../../components/SidebarNav/footer'

import { WorkspaceDropdown } from '../../components/WorkspaceDropdown'
import { useWorkspace } from '../../contexts/WorkspaceContext'

import {
  ContentInner,
  ContentWrapper,
  LayoutContainer,
  MainContainer,
} from './styles'
import { MainLayoutParams } from './types'
import { isProfileRoute, shouldShowNoTeamBlocker } from './utils/helpers'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { GlobalSearch } from '../../components/GlobalSearch'
import { InteleBit } from '../../components/InteleBit'

type SidebarWithCollapseProps = ComponentProps<typeof Sidebar> & {
  collapsed: boolean
  setCollapsed: Dispatch<SetStateAction<boolean>>
}

const SidebarWithCollapse = Sidebar as FC<SidebarWithCollapseProps>

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { workspaceId } = useParams<MainLayoutParams>()
  const {
    workspaces,
    workspacesLoading,
    teams,
    teamsLoading,
    currentWorkspace,
    setCurrentWorkspace,
  } = useWorkspace()

  const showNoTeamBlocker = shouldShowNoTeamBlocker({
    workspaceId,
    workspacesLoading,
    teamsLoading,
    teamsCount: teams.length,
    pathname: location.pathname,
  })

  useEffect(() => {
    if (!workspaceId || workspacesLoading) return
    const workspace = workspaces.find((item) => item.id === workspaceId)
    if (workspace) {
      setCurrentWorkspace(workspace)
    } else {
      navigate('/workspaces', { replace: true })
    }
  }, [
    workspaceId,
    workspaces,
    workspacesLoading,
    setCurrentWorkspace,
    navigate,
  ])

  if (!workspaceId) return null

  const profileRoute = isProfileRoute(location.pathname, workspaceId)

  return (
    <LayoutContainer>
      <Modal
        open={showNoTeamBlocker}
        onClose={() => navigate('/workspaces')}
        title="Create your first team"
        size="medium"
        footer={
          <Inline gap="100" justify="flex-end" fullWidth wrap>
            <Button variant="glass" onClick={() => navigate('/workspaces')}>
              Back to workspaces
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                workspaceId &&
                navigate(`/workspace/${workspaceId}/workspace/teams/new`)
              }
              disabled={!workspaceId}
            >
              Create team
            </Button>
          </Inline>
        }
      >
        <Stack gap="100">
          <Text variant="body2" color="color.text.DEFAULT" as="p">
            This workspace has no teams yet. Create a team to get started with
            projects and issues.
          </Text>
        </Stack>
      </Modal>

      <MainContainer>
        <SidebarWithCollapse
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
        >
          <SidebarHeader>
            {sidebarCollapsed ? (
              <Button
                buttonType="icon"
                variant="primary"
                icon={<ChevronRight size={16} />}
                onClick={() => setSidebarCollapsed(false)}
              />
            ) : (
              <Inline fullWidth wrap={false}>
                <WorkspaceDropdown
                  workspaces={workspaces}
                  selectedWorkspace={currentWorkspace}
                  onSelect={setCurrentWorkspace}
                />
                <Button
                  buttonType="icon"
                  variant="primary"
                  icon={<ChevronLeft size={16} />}
                  onClick={() => setSidebarCollapsed(true)}
                />
              </Inline>
            )}
          </SidebarHeader>

          {!sidebarCollapsed && (
            <GlobalSearch
              sidebarCollapsed={sidebarCollapsed}
              profileRoute={profileRoute}
            />
          )}

          <SidebarContent>
            <SidebarNav
              workspaceId={workspaceId}
              teams={teams}
              collapsed={sidebarCollapsed}
            />
          </SidebarContent>

          <SidebarFooter divider={false}>
            <SidebarNavFooter
              workspaceId={workspaceId}
              collapsed={sidebarCollapsed}
            />
          </SidebarFooter>
        </SidebarWithCollapse>

        <ContentWrapper>
          <ContentInner>
            <Outlet />
          </ContentInner>
        </ContentWrapper>
      </MainContainer>

      <InteleBit />
    </LayoutContainer>
  )
}
