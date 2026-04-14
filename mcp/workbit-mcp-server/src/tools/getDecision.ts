import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { makeWorkbitRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import {
  DecisionId,
  DecisionStatus,
  DecisionType,
  ProjectId,
} from './schema.js'

export function registerGetDecisionTool(server: McpServer): void {
  server.registerTool(
    'getDecision',
    {
      description: 'Get decision.',
      inputSchema: {
        projectId: ProjectId,
        decisionId: DecisionId,
      },
    },
    async ({ projectId, decisionId }) => {
      try {
        const response = await makeWorkbitRequest<{
          items?: unknown[]
        }>(`/projects/${encodeURIComponent(projectId)}/decisions?pageSize=200`)
        const items = Array.isArray(response?.items) ? response.items : []
        const decision = items.find(
          (d) =>
            d &&
            typeof d === 'object' &&
            (d as { id?: string }).id === decisionId
        )
        const result = decision ?? {
          error: `Decision not found for id: ${decisionId}`,
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.getDecision', { projectId, decisionId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch decision from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'getProjectDecisions',
    {
      description: 'List project decisions.',
      inputSchema: {
        projectId: ProjectId,
        status: DecisionStatus.or(z.literal('all')).optional(),
        type: DecisionType.or(z.literal('all')).optional(),
        limit: z.number().int().positive().optional(),
      },
    },
    async ({ projectId, status, type, limit }) => {
      try {
        let path = `/projects/${encodeURIComponent(projectId)}/decisions`
        const params: string[] = []

        if (status && status !== 'all') {
          params.push(`status=${encodeURIComponent(status)}`)
        }
        if (type && type !== 'all') {
          params.push(`type=${encodeURIComponent(type)}`)
        }
        if (limit) {
          params.push(`pageSize=${limit}`)
        }

        if (params.length > 0) {
          path += `?${params.join('&')}`
        }

        const decisions = await makeWorkbitRequest<unknown>(path)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(decisions, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.getProjectDecisions', {
          projectId,
          status,
          type,
        })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch decisions from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
