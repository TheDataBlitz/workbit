import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Sidebar } from '../../components/Sidebar'
import { MemberDetail, MemberList, openDrawer } from '../../components'
import { pdT } from '../project-detail/pdTokens'
import {
  useMeMember,
  useSidebarWorkspaces,
  useWorkspaceMembers,
  useWorkspaceProjects,
} from '../project-detail/hooks'

const LayoutRoot = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: stretch;
`

const SidebarHost = styled.div`
  flex: 0 0 auto;
  width: 20rem;
  height: 100vh;
  max-height: 100vh;
  position: sticky;
  top: 0;
  align-self: flex-start;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const SidebarViewport = styled.div`
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
`

const ContentHost = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 100vh;
`

const Page = styled.div`
  min-height: 100vh;
  box-sizing: border-box;
  background: ${pdT.pageBg};
  color: ${pdT.pageFg};
  padding: ${pdT.space600} ${pdT.space400} 7rem;

  @media (min-width: 768px) {
    padding-left: ${pdT.space600};
    padding-right: ${pdT.space600};
  }
`

const Shell = styled.div`
  max-width: 72rem;
  margin: 0 auto;
`

const Panel = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: ${pdT.space400};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`

export function WorkspaceMembers() {
  const navigate = useNavigate()

  const me = useMeMember()
  const {
    sidebarWorkspaces,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
  } = useSidebarWorkspaces()
  const { sidebarProjects } = useWorkspaceProjects(selectedWorkspaceId)
  const workspaceMembers = useWorkspaceMembers(selectedWorkspaceId)

  const workspaceName = useMemo(() => {
    const wid = selectedWorkspaceId
    if (!wid) return 'Workspace'
    return sidebarWorkspaces.find((w) => w.id === wid)?.name ?? 'Workspace'
  }, [selectedWorkspaceId, sidebarWorkspaces])

  const memberListItems = useMemo(() => {
    const all = workspaceMembers.data ?? []
    return all.map((m) => ({
      id: m.id,
      name: m.name,
      subtitle: m.username ? `@${m.username}` : undefined,
      role: m.status ? m.status.toUpperCase() : undefined,
      avatarSrc: m.avatarSrc,
    }))
  }, [workspaceMembers.data])

  return (
    <LayoutRoot>
      <SidebarHost>
        <SidebarViewport>
          <Sidebar
            projects={sidebarProjects}
            workspaces={sidebarWorkspaces.length > 0 ? sidebarWorkspaces : undefined}
            selectedWorkspaceId={selectedWorkspaceId}
            onWorkspaceChange={(wid) => setSelectedWorkspaceId(wid)}
            userName={me.data?.name ?? undefined}
            userTitle={
              me.data?.email?.trim()
                ? me.data.email
                : me.data?.username?.trim()
                  ? `@${me.data.username}`
                  : undefined
            }
            onProjectSelect={(id) => navigate(`/projects/${id}`)}
            onSettingsClick={() => navigate('/settings')}
            onWorkspaceMembersClick={() => navigate('/workspace/members')}
            workspaceMembersActive
          />
        </SidebarViewport>
      </SidebarHost>

      <ContentHost>
        <Page>
          <Shell>
            <Stack gap="400" fullWidth>
              <Panel aria-label="Workspace members">
                <Stack gap="150" fullWidth>
                  <Text
                    as="h1"
                    variant="heading3"
                    color="color.text.DEFAULT"
                    style={{ margin: 0, fontWeight: 850 }}
                  >
                    Members
                  </Text>
                  <Text
                    as="p"
                    variant="body2"
                    color="color.text.subtle"
                    style={{ margin: 0, lineHeight: 1.6 }}
                  >
                    {workspaceName}
                  </Text>
                </Stack>
              </Panel>

              {workspaceMembers.isLoading ? (
                <Panel>
                  <Text as="p" variant="body2" color="color.text.subtle" style={{ margin: 0 }}>
                    Loading members…
                  </Text>
                </Panel>
              ) : workspaceMembers.isError ? (
                <Panel>
                  <Text as="p" variant="body2" color="color.text.subtle" style={{ margin: 0 }}>
                    Couldn’t load workspace members.
                  </Text>
                </Panel>
              ) : memberListItems.length === 0 ? (
                <Panel>
                  <Text as="p" variant="body2" color="color.text.subtle" style={{ margin: 0 }}>
                    No members found.
                  </Text>
                </Panel>
              ) : (
                <MemberList
                  members={memberListItems}
                  onMemberClick={(m) => {
                    openDrawer({
                      type: 'member-detail',
                      title: 'Member',
                      children: (
                        <MemberDetail
                          member={{
                            id: m.id,
                            name: m.name,
                            username: m.subtitle?.startsWith('@')
                              ? m.subtitle.slice(1)
                              : undefined,
                            avatarSrc: m.avatarSrc,
                            role: m.role ?? undefined,
                            subtitle: m.subtitle ?? undefined,
                          }}
                        />
                      ),
                    })
                  }}
                />
              )}
            </Stack>
          </Shell>
        </Page>
      </ContentHost>
    </LayoutRoot>
  )
}

