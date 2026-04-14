import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { makeWorkbitRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import { IssueId, ProjectId } from './schema.js'

export function registerGetIssueTool(server: McpServer): void {
  server.registerTool(
    'getIssue',
    {
      description: 'Get issue.',
      inputSchema: {
        issueId: IssueId,
      },
    },
    async ({ issueId }) => {
      try {
        const issue = await makeWorkbitRequest<unknown>(
          `/issues/${encodeURIComponent(issueId)}`
        )

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.getIssue', { issueId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch issue from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
  server.registerTool(
    'getIssuesByProject',
    {
      description: 'List project issues.',
      inputSchema: {
        projectId: ProjectId,
      },
    },
    async ({ projectId }) => {
      try {
        const issues = await makeWorkbitRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/issues`
        )

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.getIssuesByProject', { projectId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch issues from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
