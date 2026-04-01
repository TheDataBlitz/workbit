import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box } from '@thedatablitz/box'
import { Alert } from '@thedatablitz/alert'
import { Breadcrumbs, BreadcrumbsItem } from '@thedatablitz/breadcrumb'
import { Button } from '@thedatablitz/button'
import { Card, CardContent, CardFooter } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Tabs } from '@thedatablitz/tabs'
import { Text } from '@thedatablitz/text'
import { PropertiesSection } from '../../components'
import type { ActivityItem } from '../../components'
import { noop } from '../../utils/noop'
import { formatDateTime } from '../../utils/format'
import { logError } from '../../utils/errorHandling'
import {
  fetchTeamProject,
  patchProject,
  runProjectAgent,
} from '../../api/client'
import type { ApiProjectProperties } from '../../api/client'
import type { TeamProjectDetailScreenProps } from './types'
import { Bot, Plus } from 'lucide-react'
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
  const [agentRunningMode, setAgentRunningMode] = useState<
    'single' | 'planner_worker' | null
  >(null)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [agentOutcome, setAgentOutcome] = useState<{
    summary: string
    finishedReason?: string
    plan?: string
    mode: string
  } | null>(null)
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

  const handleRunAgent = (mode: 'single' | 'planner_worker') => {
    if (!projectId) return
    setAgentRunningMode(mode)
    setAgentError(null)
    setAgentOutcome(null)
    runProjectAgent(projectId, { mode })
      .then((out) => {
        setAgentOutcome({
          summary: out.summary,
          finishedReason: out.finishedReason,
          plan: out.plan,
          mode: out.mode,
        })
      })
      .catch((e) => {
        logError(e, 'TeamProjectDetail.runProjectAgent')
        setAgentError((e as Error).message)
      })
      .finally(() => setAgentRunningMode(null))
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
                      <Button
                        variant="glass"
                        size="small"
                        icon={<Bot size={16} />}
                        disabled={agentRunningMode !== null || !projectId}
                        onClick={() => handleRunAgent('single')}
                      >
                        {agentRunningMode === 'single'
                          ? 'Running…'
                          : 'Run agent'}
                      </Button>
                      <Button
                        variant="glass"
                        size="small"
                        icon={<Bot size={16} />}
                        disabled={agentRunningMode !== null || !projectId}
                        onClick={() => handleRunAgent('planner_worker')}
                      >
                        {agentRunningMode === 'planner_worker'
                          ? 'Running…'
                          : 'Plan & run'}
                      </Button>
                    </Inline>
                  </Stack>
                </Inline>

                {agentError ? (
                  <Alert
                    variant="error"
                    placement="inline"
                    description={agentError}
                    className="w-full"
                  />
                ) : null}
                {agentOutcome ? (
                  <Card fullWidth variant="default" size="small">
                    <CardContent>
                      <Stack gap="200">
                        <Text variant="caption2" color="color.text.subtle">
                          Agent · {agentOutcome.mode}
                          {agentOutcome.finishedReason
                            ? ` · ${agentOutcome.finishedReason}`
                            : ''}
                        </Text>
                        {agentOutcome.plan ? (
                          <>
                            <Text variant="heading6">Plan</Text>
                            <Text
                              variant="body3"
                              paragraphSpacing
                              style={{ whiteSpace: 'pre-wrap' }}
                            >
                              {agentOutcome.plan}
                            </Text>
                          </>
                        ) : null}
                        <Text variant="heading6">Summary</Text>
                        <Text
                          variant="body3"
                          paragraphSpacing
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          {agentOutcome.summary}
                        </Text>
                      </Stack>
                    </CardContent>
                    <CardFooter>
                      <Button
                        buttonType="link"
                        size="small"
                        onClick={() => {
                          setAgentOutcome(null)
                          setAgentError(null)
                        }}
                      >
                        Dismiss
                      </Button>
                    </CardFooter>
                  </Card>
                ) : null}

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
