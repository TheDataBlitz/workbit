import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box } from '@thedatablitz/box'
import { Breadcrumbs, BreadcrumbsItem } from '@thedatablitz/breadcrumb'
import { Button } from '@thedatablitz/button'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Tabs } from '@thedatablitz/tabs'
import { Text } from '@thedatablitz/text'
import { PropertiesSection } from '../../components'
import type { ActivityItem } from '../../components'
import { noop } from '../../utils/noop'
import { formatDateTime } from '../../utils/format'
import { logError } from '../../utils/errorHandling'
import { fetchTeamProject, patchProject } from '../../api/client'
import type { ApiProjectProperties } from '../../api/client'
import type { TeamProjectDetailScreenProps } from './types'
import { Plus } from 'lucide-react'
import { useProjectPeopleProperties } from './hooks/useProjectPeopleProperties'
import { PageHeader } from '@thedatablitz/page-header'
import { ProjectDetailDecisionsTab } from './Decisions'
import { ProjectDetailDocumentsTab } from './Documents'
import { ProjectDetailIssuesTab } from './Issues'
import { ProjectDetailOverviewStatus } from './Status'
import { useProjectDetailUpdates } from './hooks/useProjectDetail'
import { ProjectDetailUpdatesTab } from './Updates'

export function TeamProjectDetailScreen({
  projectName,
  teamId,
  activeTab,
  documentationMode,
}: TeamProjectDetailScreenProps) {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const navigate = useNavigate()

  const projectUpdates = useProjectDetailUpdates(teamId, projectId)

  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [properties, setProperties] = useState<ApiProjectProperties | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [projectDescription, setProjectDescription] = useState('')
  const { teamMembers, handleLeadChange, handleMemberIdsChange } =
    useProjectPeopleProperties({
      teamId,
      setProperties,
    })

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'updates', label: 'Updates' },
    { id: 'issues', label: 'Issues' },
    { id: 'documentation', label: 'Documentation' },
    { id: 'decisions', label: 'Decisions' },
  ]

  useEffect(() => {
    if (!teamId) return
    setLoading(true)
    fetchTeamProject(teamId)
      .then((data) => {
        if (!data.project) {
          setActivity([])
          setProjectDescription('')
          setProperties(null)
          return
        }

        setActivity(
          data.project.activity.map((item) => ({
            ...item,
            date: formatDateTime(item.date),
          }))
        )
        setProjectDescription(data.project.description ?? '')
        setProperties(data.project.properties)
      })
      .catch((e) => logError(e, 'TeamProjectDetail'))
      .finally(() => setLoading(false))
  }, [teamId])

  const handleStatusChange = (status: string) => {
    if (!teamId) return
    setProperties((prev) => (prev ? { ...prev, status } : null))
    void patchProject(teamId, { status }).catch((e) =>
      logError(e, 'TeamProjectDetail')
    )
  }

  const handlePriorityChange = (priority: string) => {
    if (!teamId) return
    setProperties((prev) => (prev ? { ...prev, priority } : null))
    void patchProject(teamId, { priority }).catch((e) =>
      logError(e, 'TeamProjectDetail')
    )
  }

  if (loading) {
    return (
      <Inline align="flex-start" gap="400" fullWidth wrap={false}>
        <Box border padding="400" fullWidth>
          <Text variant="body3" color="color.text.subtle">
            Loading project...
          </Text>
        </Box>
        <Box border padding="300" fullWidth />
      </Inline>
    )
  }

  return (
    <Stack gap="600">
      <PageHeader
        title={projectName}
        subtitle="Project details"
        avatar={{ name: projectName[0]?.toUpperCase() ?? 'P' }}
      >
        <Breadcrumbs separator=">">
          <BreadcrumbsItem text="Projects" />
          <BreadcrumbsItem text={projectName} current />
        </Breadcrumbs>
      </PageHeader>

      <Inline align="flex-start" gap="400" fullWidth wrap={false}>
        <Stack fullWidth gap="200">
          <Tabs
            items={tabs}
            value={activeTab}
            onChange={(nextTab) => {
              if (!workspaceId || !teamId || !projectId) return
              const base = `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}`
              if (nextTab === 'documentation') {
                navigate(`${base}/documentation`)
                return
              }
              navigate(`${base}/${nextTab}`)
            }}
          />

          {activeTab === 'overview' && (
            <Box border padding="400">
              <Stack gap="400">
                <Inline align="flex-start" justify="space-between" fullWidth>
                  <Stack gap="200">
                    {projectDescription ? (
                      <Text variant="body2" color="color.text.subtle">
                        {projectDescription}
                      </Text>
                    ) : null}
                    <Inline fullWidth wrap gap="100">
                      <Button
                        icon={<Plus size={16} />}
                        variant="warning"
                        size="small"
                        onClick={() => {
                          if (workspaceId && teamId && projectId) {
                            navigate(
                              `/workspace/${workspaceId}/team/${teamId}/projects/${projectId}/documentation/new`
                            )
                          }
                        }}
                      >
                        Add document or link
                      </Button>
                    </Inline>
                  </Stack>
                </Inline>

                <ProjectDetailOverviewStatus {...projectUpdates} />
              </Stack>
            </Box>
          )}

          {activeTab === 'updates' && (
            <ProjectDetailUpdatesTab
              updatesTreeItems={projectUpdates.updatesTreeItems}
              handleAddComment={projectUpdates.handleAddComment}
              handlePostUpdate={projectUpdates.handlePostUpdate}
              isLoading={projectUpdates.isLoading}
            />
          )}

          {activeTab === 'issues' && (
            <ProjectDetailIssuesTab
              workspaceId={workspaceId}
              teamId={teamId}
              projectId={projectId}
            />
          )}

          {activeTab === 'documentation' && documentationMode === 'list' && (
            <ProjectDetailDocumentsTab
              workspaceId={workspaceId}
              teamId={teamId}
              projectId={projectId}
            />
          )}

          {activeTab === 'decisions' && projectId && teamId && (
            <ProjectDetailDecisionsTab projectId={projectId} teamId={teamId} />
          )}
        </Stack>

        <Stack gap="200" className="max-w-[300px]" fullWidth>
          <Box>
            <Text variant="heading6">Other Details</Text>
          </Box>
          <Box border padding="200">
            <Text variant="heading7">Properties</Text>
            <PropertiesSection
              key={`${properties?.status}-${properties?.priority}-${properties?.memberIds?.join(',') ?? ''}`}
              contentOnly
              defaultStatus={properties?.status}
              defaultPriority={properties?.priority}
              defaultLeadId={
                typeof properties?.leadId === 'string'
                  ? properties.leadId
                  : undefined
              }
              defaultMemberIds={
                Array.isArray(properties?.memberIds)
                  ? properties.memberIds.filter(
                      (memberId): memberId is string =>
                        typeof memberId === 'string'
                    )
                  : []
              }
              teamMembers={teamMembers}
              defaultStartDate={
                properties?.startDate
                  ? new Date(properties.startDate)
                  : undefined
              }
              defaultEndDate={
                properties?.endDate ? new Date(properties.endDate) : undefined
              }
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onLeadChange={handleLeadChange}
              onMemberIdsChange={handleMemberIdsChange}
            />
          </Box>

          <Box border padding="200">
            <Inline align="center" justify="space-between" fullWidth>
              <Text variant="heading7">Activity</Text>
              <Button buttonType="link" size="small" onClick={noop}>
                See all
              </Button>
            </Inline>
            {activity.length > 0 ? (
              <Text variant="body3" color="color.text.subtle">
                {activity.length} recent activit
                {activity.length === 1 ? 'y' : 'ies'}
              </Text>
            ) : (
              <Text variant="body3" color="color.text.subtle">
                No activity yet
              </Text>
            )}
          </Box>
        </Stack>
      </Inline>
    </Stack>
  )
}
