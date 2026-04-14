import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  makeWorkbitPostRequest,
  makeWorkbitRequest,
} from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import { ProjectHealthStatus, ProjectId, TeamId } from './schema.js'

export function registerCreateProjectStatusUpdateTool(server: McpServer): void {
  server.registerTool(
    'createProjectStatusUpdate',
    {
      description: 'Create project update.',
      inputSchema: {
        teamId: TeamId.optional(),
        projectId: ProjectId,
        content: z.string().min(1),
        status: ProjectHealthStatus.optional(),
      },
    },
    async ({ teamId, projectId, content, status }) => {
      try {
        let resolvedTeamId = (teamId ?? '').trim()
        if (!resolvedTeamId) {
          const projects = await makeWorkbitRequest<unknown[]>(
            '/workspace/projects'
          )
          const match =
            Array.isArray(projects) &&
            projects.find(
              (p) =>
                p &&
                typeof p === 'object' &&
                (p as { id?: string })?.id === projectId
            )

          let teamIdFromProject = ''
          if (match && typeof match === 'object') {
            const raw = (match as { teamId?: unknown })?.teamId
            teamIdFromProject = typeof raw === 'string' ? raw.trim() : ''
          }
          resolvedTeamId = teamIdFromProject

          if (!resolvedTeamId) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Unable to resolve team for this project. Please provide `teamId`, or ensure the project has a team.',
                },
              ],
            }
          }
        }

        const payload: Record<string, unknown> = {
          content,
          projectId,
          status: status ?? 'on-track',
        }
        const update = await makeWorkbitPostRequest<unknown>(
          `/teams/${encodeURIComponent(resolvedTeamId)}/project/updates`,
          payload
        )
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(update, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.createProjectStatusUpdate', {
          teamId,
          projectId,
        })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create project status update in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
