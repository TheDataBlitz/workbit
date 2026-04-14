import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { makeWorkbitPatchRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import { MemberId, TeamId } from './schema.js'

export function registerUpdateProjectTool(server: McpServer): void {
  server.registerTool(
    'updateProject',
    {
      description: 'Update project.',
      inputSchema: {
        teamId: TeamId,
        status: z.string().optional(),
        priority: z.string().optional(),
        leadId: MemberId.optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        memberIds: z.array(MemberId).optional(),
        teamIds: z.array(TeamId).optional(),
        labelIds: z.array(z.string()).optional(),
      },
    },
    async ({
      teamId,
      status,
      priority,
      leadId,
      startDate,
      endDate,
      memberIds,
      teamIds,
      labelIds,
    }) => {
      try {
        const payload: Record<string, unknown> = {}
        if (status !== undefined) payload.status = status
        if (priority !== undefined) payload.priority = priority
        if (leadId !== undefined) payload.leadId = leadId
        if (startDate !== undefined) payload.startDate = startDate
        if (endDate !== undefined) payload.endDate = endDate
        if (memberIds !== undefined) payload.memberIds = memberIds
        if (teamIds !== undefined) payload.teamIds = teamIds
        if (labelIds !== undefined) payload.labelIds = labelIds

        if (Object.keys(payload).length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No fields to update. Provide at least one of: status, priority, leadId, startDate, endDate, memberIds, teamIds, labelIds.',
              },
            ],
          }
        }

        const result = await makeWorkbitPatchRequest<unknown>(
          `/teams/${encodeURIComponent(teamId)}/project`,
          payload
        )
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.updateProject', { teamId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to update project in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}

export function registerUpdateProjectStatusTool(server: McpServer): void {
  server.registerTool(
    'updateProjectStatus',
    {
      description: 'Update project status.',
      inputSchema: {
        teamId: TeamId,
        status: z.string().min(1),
      },
    },
    async ({ teamId, status }) => {
      try {
        const result = await makeWorkbitPatchRequest<unknown>(
          `/teams/${encodeURIComponent(teamId)}/project`,
          { status }
        )
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.updateProjectStatus', { teamId, status })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to update project status in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
