import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { makeWorkbitPostRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import { MemberId, ProjectId } from './schema.js'

export function registerAddTeamMembersToProjectTool(server: McpServer): void {
  server.registerTool(
    'addTeamMembersToProject',
    {
      description: 'Sync project members.',
      inputSchema: {
        projectId: ProjectId,
      },
    },
    async ({ projectId }) => {
      try {
        const result = await makeWorkbitPostRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/members/from-team`,
          {}
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.addTeamMembersToProject', { projectId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to add team members to project in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}

export function registerAssignProjectLeadTool(server: McpServer): void {
  server.registerTool(
    'assignProjectLead',
    {
      description: 'Set project lead.',
      inputSchema: {
        projectId: ProjectId,
        leadId: MemberId.optional(),
      },
    },
    async ({ projectId, leadId }) => {
      try {
        const trimmed = (leadId ?? '').trim()
        const result = await makeWorkbitPostRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/lead`,
          { leadId: trimmed }
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.assignProjectLead', { projectId, leadId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to assign project lead in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
