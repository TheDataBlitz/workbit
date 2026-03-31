import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { makeWorkbitPatchRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'

export function registerUpdateProjectDecisionTool(server: McpServer): void {
  server.registerTool(
    'updateProjectDecision',
    {
      description:
        'Update an existing decision in a project with one or more fields.',
      inputSchema: {
        projectId: z
          .string()
          .min(1)
          .describe('The project ID that contains the decision.'),
        decisionId: z.string().min(1).describe('The decision ID to update.'),
        title: z.string().optional().describe('Optional updated title.'),
        type: z
          .enum(['major', 'minor'])
          .optional()
          .describe('Optional updated decision type.'),
        rationale: z
          .string()
          .optional()
          .describe('Optional updated rationale.'),
        impact: z.string().optional().describe('Optional updated impact.'),
        decisionDate: z
          .string()
          .optional()
          .describe('Optional updated ISO decision date.'),
        status: z
          .enum(['proposed', 'approved', 'rejected', 'superseded'])
          .optional()
          .describe('Optional updated status.'),
        tags: z.array(z.string()).optional().describe('Optional tags list.'),
        linkedIssueIds: z
          .array(z.string())
          .optional()
          .describe('Optional linked issue IDs.'),
      },
    },
    async ({
      projectId,
      decisionId,
      title,
      type,
      rationale,
      impact,
      decisionDate,
      status,
      tags,
      linkedIssueIds,
    }) => {
      try {
        const payload: Record<string, unknown> = {}
        if (title !== undefined) payload.title = title
        if (type !== undefined) payload.type = type
        if (rationale !== undefined) payload.rationale = rationale
        if (impact !== undefined) payload.impact = impact
        if (decisionDate !== undefined) payload.decisionDate = decisionDate
        if (status !== undefined) payload.status = status
        if (tags !== undefined) payload.tags = tags
        if (linkedIssueIds !== undefined)
          payload.linkedIssueIds = linkedIssueIds

        if (Object.keys(payload).length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No fields to update. Provide at least one decision field.',
              },
            ],
          }
        }

        const updated = await makeWorkbitPatchRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/decisions/${encodeURIComponent(decisionId)}`,
          payload
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.updateProjectDecision', {
          projectId,
          decisionId,
        })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to update project decision in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
