import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { makeWorkbitPostRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import { DecisionStatus, DecisionType, ProjectId } from './schema.js'

export function registerCreateDecisionTool(server: McpServer): void {
  server.registerTool(
    'createDecision',
    {
      description: 'Create decision.',
      inputSchema: {
        projectId: ProjectId,
        title: z.string().min(1),
        type: DecisionType,
        status: DecisionStatus.optional(),
        rationale: z.string().min(1),
        impact: z.string().optional(),
        decisionDate: z.string().optional(),
        tags: z.array(z.string()).optional(),
        linkedIssueIds: z.array(z.string()).optional(),
      },
    },
    async ({
      projectId,
      title,
      type,
      status,
      rationale,
      impact,
      decisionDate,
      tags,
      linkedIssueIds,
    }) => {
      try {
        const payload: {
          title: string
          type: string
          status?: string
          rationale: string
          impact?: string
          decisionDate?: string
          tags?: string[]
          linkedIssueIds?: string[]
        } = {
          title,
          type,
          rationale,
        }

        // Add optional fields if provided
        if (status) {
          payload.status = status
        }
        if (impact) {
          payload.impact = impact
        }
        if (decisionDate) {
          payload.decisionDate = decisionDate
        }
        if (tags && tags.length > 0) payload.tags = tags
        if (linkedIssueIds && linkedIssueIds.length > 0)
          payload.linkedIssueIds = linkedIssueIds

        const path = `/projects/${encodeURIComponent(projectId)}/decisions`
        const decision = await makeWorkbitPostRequest<unknown>(path, payload)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(decision, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.createDecision', { projectId, title })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create decision in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
