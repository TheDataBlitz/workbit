import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { makeWorkbitPostRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import { IssueId, ProjectId, TeamId } from './schema.js'

function countWords(input: string): number {
  return input.trim().split(/\s+/).filter(Boolean).length
}

function buildElaborateDescription(
  title: string,
  description: string | null | undefined
): string {
  const createdByLine = 'Created by: AI Generated'
  const userText = (description ?? '').trim()
  const base =
    userText.length > 0
      ? userText
      : `Deliver the "${title}" work item with clear implementation details and expected outcome.`

  // Ensure generated descriptions are substantial and actionable.
  if (countWords(base) >= 40) {
    return `${createdByLine}\n\n${base}`
  }

  return `${createdByLine}

Context:
${base}

Implementation outline:
- Define the scope and key deliverables for "${title}".
- Break work into concrete implementation steps with dependencies.
- Note edge cases, constraints, and assumptions relevant to execution.

Acceptance criteria:
- Outcome is testable and aligned with project goals.
- Required dependencies, risks, and follow-up items are documented.
- Completion state and next steps are clear for the team.`
}

export function registerCreateIssueTool(server: McpServer): void {
  server.registerTool(
    'createIssue',
    {
      description:
        'Create issue. Use projectId for project-scoped tickets; teamId is optional.',
      inputSchema: {
        title: z.string().min(1),
        description: z.string().optional(),
        projectId: ProjectId.optional(),
        teamId: TeamId.optional(),
        parentIssueId: IssueId.optional(),
      },
    },
    async ({ title, description, projectId, teamId, parentIssueId }) => {
      try {
        const descriptionWithSource = buildElaborateDescription(
          title,
          description
        )

        const payload: {
          title: string
          description?: string
          projectId?: string
          teamId?: string
          parentIssueId?: string
        } = { title, description: descriptionWithSource }
        if (projectId != null && projectId !== '') {
          payload.projectId = projectId
        }
        if (teamId != null && teamId !== '') {
          payload.teamId = teamId
        }
        if (parentIssueId != null && parentIssueId !== '') {
          payload.parentIssueId = parentIssueId
        }

        const path = teamId
          ? `/teams/${encodeURIComponent(teamId)}/issues`
          : '/issues'
        const issue = await makeWorkbitPostRequest<unknown>(path, payload)

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.createIssue', { title })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create issue in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
