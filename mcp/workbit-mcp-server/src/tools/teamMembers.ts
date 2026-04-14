import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { makeWorkbitPostRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'

export function registerAddTeamMemberTool(server: McpServer): void {
  server.registerTool(
    'addTeamMember',
    {
      description: 'Add an existing member to a team by memberId.',
      inputSchema: {
        teamId: z.string().min(1).describe('Team ID.'),
        memberId: z.string().min(1).describe('Member ID to add to the team.'),
      },
    },
    async ({ teamId, memberId }) => {
      try {
        const result = await makeWorkbitPostRequest<unknown>(
          `/teams/${encodeURIComponent(teamId)}/members`,
          { memberId }
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.addTeamMember', { teamId, memberId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to add member to team in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
