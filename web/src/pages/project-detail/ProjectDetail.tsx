import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Avatar } from '@thedatablitz/avatar'
import { Badge } from '@thedatablitz/badge'
import { Box } from '@thedatablitz/box'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { Sidebar } from '../../components/Sidebar'
import { MemberDetail, MemberList, openDrawer } from '../../components'
import {
  useMeMember,
  useProjectProperties,
  useProjectSummary,
  useSidebarWorkspaces,
  useTeamMembers,
  useWorkspaceProjects,
} from './hooks'
import { ProjectDecisionsTab } from './components/ProjectDecisionsTab'
import { ProjectDetailTabs } from './components/ProjectDetailTabs'
import { ProjectIntelBitBar } from './components/ProjectIntelBitBar'
import { ProjectIssuesTab } from './components/ProjectIssuesTab'
import { ProjectUpdatesTab } from './components/ProjectUpdatesTab'
import { pdT } from './pdTokens'
import { projectDetailMock, type ProjectDetailTabId } from './projectDetailMock'
import { ProjectOverviewTab } from './components/ProjectOverviewTab'

/**
 * `@thedatablitz/card` ships `variant="base"` + `borderTone` at runtime; the
 * package entry `types` field still points at legacy `Card` props, so we narrow here.
 */

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

/** Fills the viewport height so the sidebar panel can shrink and scroll internally */
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

/** Fallback surface when not using `Card variant="base"` (see `ProjectSectionCard`). */
const DetailPanel = styled.section`
  width: 100%;
  box-sizing: border-box;
  padding: ${pdT.space400};
  border-radius: ${pdT.radiusMd};
  background: ${pdT.surfaceRaised};
  border: 1px solid color-mix(in srgb, ${pdT.border} 35%, transparent);
`

const ProjectHeader = ({
  d,
  titleOverride,
  descriptionOverride,
  badgeLabelsOverride,
  members,
  leadId,
  onCollaboratorsClick,
}: {
  d: typeof projectDetailMock
  titleOverride?: string
  descriptionOverride?: string
  badgeLabelsOverride?: { team?: string; status?: string; priority?: string }
  members: Array<{ id: string; name: string }>
  leadId?: string
  onCollaboratorsClick?: () => void
}) => {
  const badges =
    badgeLabelsOverride &&
    (badgeLabelsOverride.team ||
      badgeLabelsOverride.status ||
      badgeLabelsOverride.priority)
      ? [
          {
            id: 'team',
            label: badgeLabelsOverride.team ?? 'TEAM —',
            variant: 'neutral' as const,
          },
          {
            id: 'status',
            label: badgeLabelsOverride.status ?? 'STATUS —',
            variant: 'neutral' as const,
          },
          {
            id: 'priority',
            label: badgeLabelsOverride.priority ?? 'PRIORITY —',
            variant: 'secondary' as const,
          },
        ]
      : d.badges

  return (
    <header>
      <Stack gap="300" fullWidth>
        <Inline wrap gap="100" align="center">
          {badges.map((b) => (
            <Badge
              key={b.id}
              variant={b.variant}
              size="small"
              label={b.label}
            />
          ))}
        </Inline>
        <Inline
          justify="space-between"
          align="flex-start"
          gap="400"
          wrap
          fullWidth
        >
          <div style={{ flex: '1 1 20rem', minWidth: 0 }}>
            <Stack gap="200" fullWidth>
              <Text
                as="h1"
                variant="heading1"
                color="color.text.DEFAULT"
                style={{
                  margin: 0,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                {titleOverride ?? d.title}
              </Text>
              <Text
                as="p"
                variant="body2"
                color="color.text.subtle"
                style={{ margin: 0, maxWidth: '40rem' }}
              >
                {descriptionOverride ?? d.description}
              </Text>
            </Stack>
          </div>
          <div
            onClick={onCollaboratorsClick}
            onKeyDown={(e) => {
              if (!onCollaboratorsClick) return
              if (e.key === 'Enter' || e.key === ' ') onCollaboratorsClick()
            }}
            role={onCollaboratorsClick ? 'button' : undefined}
            tabIndex={onCollaboratorsClick ? 0 : undefined}
            aria-label="View members"
            style={onCollaboratorsClick ? { cursor: 'pointer' } : undefined}
          >
            <Inline gap="100" align="center" wrap={false}>
              {(() => {
                const lead = leadId
                  ? (members.find((m) => m.id === leadId) ?? null)
                  : null
                const rest = lead
                  ? members.filter((m) => m.id !== lead.id)
                  : members
                const ordered = lead ? [lead, ...rest] : rest
                const visible = ordered.slice(0, 5)
                const remaining = Math.max(0, ordered.length - visible.length)
                return (
                  <>
                    {visible.map((m, idx) => (
                      <Avatar
                        key={m.id}
                        variant="initials"
                        name={m.name}
                        size="medium"
                        shape={idx === 0 && lead ? 'square' : 'circle'}
                      />
                    ))}
                    {remaining > 0 ? (
                      <Badge
                        variant="neutral"
                        size="small"
                        label={`+${remaining}`}
                        style={{ marginLeft: 4 }}
                      />
                    ) : null}
                  </>
                )
              })()}
            </Inline>
          </div>
        </Inline>
      </Stack>
    </header>
  )
}

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<ProjectDetailTabId>('overview')
  const d = projectDetailMock
  const me = useMeMember()
  const { sidebarWorkspaces, selectedWorkspaceId, setSelectedWorkspaceId } =
    useSidebarWorkspaces()
  const { sidebarProjects } = useWorkspaceProjects(selectedWorkspaceId)
  const project = useProjectSummary(projectId)
  const projectProperties = useProjectProperties(projectId)
  const teamMembers = useTeamMembers(project.data?.team?.id)

  const memberListItems = useMemo(() => {
    const all = teamMembers.data ?? []
    const memberIds = projectProperties.data?.memberIds ?? []
    const scoped =
      memberIds.length > 0 ? all.filter((m) => memberIds.includes(m.id)) : all
    if (scoped.length > 0) {
      return scoped.map((m) => ({
        id: m.id,
        name: m.name,
        subtitle: m.username ? `@${m.username}` : undefined,
        avatarSrc: m.avatarSrc,
      }))
    }
    return d.collaborators.map((c) => ({
      id: c.name,
      name: c.name,
      subtitle: undefined,
      avatarSrc: undefined,
    }))
  }, [projectProperties.data?.memberIds, teamMembers.data])

  const workspaceProjectIds = useMemo(
    () => new Set(sidebarProjects.map((p) => p.id)),
    [sidebarProjects]
  )
  const firstWorkspaceProjectId = sidebarProjects[0]?.id ?? null

  useEffect(() => {
    // Stay on /projects/* when switching workspaces.
    if (!selectedWorkspaceId) return
    if (sidebarProjects.length === 0) return
    if (!projectId) return
    if (workspaceProjectIds.has(projectId)) return
    if (!firstWorkspaceProjectId) return
    navigate(`/projects/${firstWorkspaceProjectId}`, { replace: true })
  }, [
    selectedWorkspaceId,
    sidebarProjects.length,
    workspaceProjectIds,
    projectId,
    firstWorkspaceProjectId,
    navigate,
  ])

  if (projectId == null || projectId === '') {
    if (firstWorkspaceProjectId) {
      return <Navigate to={`/projects/${firstWorkspaceProjectId}`} replace />
    }
    return <Navigate to="/workspaces" replace />
  }

  return (
    <LayoutRoot>
      <SidebarHost>
        <SidebarViewport>
          <Sidebar
            projects={sidebarProjects}
            workspaces={
              sidebarWorkspaces.length > 0 ? sidebarWorkspaces : undefined
            }
            selectedWorkspaceId={selectedWorkspaceId}
            onWorkspaceChange={(wid) => {
              setSelectedWorkspaceId(wid)
            }}
            userName={me.data?.name ?? undefined}
            userTitle={
              me.data?.email?.trim()
                ? me.data.email
                : me.data?.username?.trim()
                  ? `@${me.data.username}`
                  : undefined
            }
            selectedProjectId={projectId}
            onProjectSelect={(id) => navigate(`/projects/${id}`)}
            onSettingsClick={() =>
              navigate(
                `/settings?fromProjectId=${encodeURIComponent(projectId)}`,
                {
                  state: { fromProjectId: projectId },
                }
              )
            }
          />
        </SidebarViewport>
      </SidebarHost>
      <ContentHost>
        <Page>
          <Shell>
            <Stack gap="400" fullWidth>
              <ProjectHeader
                d={d}
                titleOverride={project.data?.name}
                descriptionOverride={project.data?.description}
                badgeLabelsOverride={{
                  team: project.data?.team?.name
                    ? `TEAM: ${project.data.team.name}`.toUpperCase()
                    : undefined,
                  status: project.data?.status
                    ? `STATUS: ${project.data.status}`.toUpperCase()
                    : undefined,
                  // API doesn't expose priority yet; keep a clear placeholder.
                  priority: 'PRIORITY: —',
                }}
                members={memberListItems.map((m) => ({ id: m.id, name: m.name }))}
                leadId={projectProperties.data?.leadId ?? undefined}
                onCollaboratorsClick={() => {
                  openDrawer({
                    type: 'project-members',
                    title: 'Members',
                    children: (
                      <MemberList
                        members={memberListItems}
                        onMemberClick={(m) => {
                          openDrawer({
                            type: 'member-detail',
                            title: m.name,
                            children: (
                              <MemberDetail
                                member={{
                                  id: m.id,
                                  name: m.name,
                                  subtitle: m.subtitle,
                                  avatarSrc: m.avatarSrc,
                                }}
                              />
                            ),
                          })
                        }}
                      />
                    ),
                  })
                }}
              />
              <Box fullWidth>
                <ProjectDetailTabs
                  tabs={[...d.tabs]}
                  value={tab}
                  onChange={setTab}
                />
              </Box>

              {tab === 'updates' ? (
                <ProjectUpdatesTab />
              ) : tab === 'issues' ? (
                <ProjectIssuesTab />
              ) : tab === 'decisions' ? (
                <ProjectDecisionsTab />
              ) : tab === 'overview' ? (
                <ProjectOverviewTab
                  d={d}
                  project={project.data ?? null}
                  teamMembers={teamMembers.data ?? []}
                />
              ) : (
                <DetailPanel>
                  <Text
                    as="p"
                    variant="body2"
                    color="color.text.subtle"
                    style={{ margin: 0 }}
                  >
                    Nothing to show for this tab yet.
                  </Text>
                </DetailPanel>
              )}
            </Stack>
          </Shell>

          <ProjectIntelBitBar
            title={d.intelBar.title}
            subtitle={d.intelBar.subtitle}
            ctaLabel={`${d.intelBar.cta} →`}
            projectId={projectId}
            projectName={project.data?.name}
          />
        </Page>
      </ContentHost>
    </LayoutRoot>
  )
}
