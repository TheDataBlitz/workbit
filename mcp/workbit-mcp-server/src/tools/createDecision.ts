import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { makeWorkbitPostRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'

export function registerCreateDecisionTool(server: McpServer): void {
  server.registerTool(
    'createDecision',
    {
      description:
        'Create a decision record in a Workbit project. Use this to document architectural, technical, or process decisions.',
      inputSchema: {
        projectId: z
          .string()
          .min(1)
          .describe('The project ID where the decision will be recorded.'),
        title: z.string().min(1).describe('The decision title.'),
        type: z
          .enum(['major', 'minor'])
          .describe(
            'Decision type: major (significant impact) or minor (incremental)'
          ),
        status: z
          .enum(['proposed', 'approved', 'rejected', 'superseded'])
          .optional()
          .describe('Decision status (defaults to "proposed").'),
        rationale: z
          .string()
          .describe(
            'Rationale for the decision. Explain why this decision was made.'
          ),
        impact: z
          .string()
          .optional()
          .describe('Describe the impact and implications of this decision.'),
        decisionDate: z
          .string()
          .optional()
          .describe(
            'ISO date string (e.g., 2026-03-19) when the decision was made.'
          ),
        tags: z
          .string()
          .optional()
          .describe('Comma-separated tags for categorizing the decision.'),
        linkedIssueIds: z
          .string()
          .optional()
          .describe(
            'Comma-separated list of issue IDs related to this decision.'
          ),
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
        if (tags) {
          payload.tags = tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        }
        if (linkedIssueIds) {
          payload.linkedIssueIds = linkedIssueIds
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
        }

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
