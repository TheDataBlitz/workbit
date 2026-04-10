import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { mcpContentToStoredLexical } from '../utils/mcpLexicalContent.js'
import { makeWorkbitPostRequest } from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'

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
        'Create a new Workbit issue. Optionally link it to a project and/or team. For bulk work (many parents + sub-issues): create all parent issues first without parentIssueId; only then use createSubIssue per parent. One create per turn is preferred.',
      inputSchema: {
        title: z.string().min(1).describe('The issue title.'),
        description: z
          .string()
          .optional()
          .describe(
            'Optional issue description as Markdown or Lexical JSON string. Markdown is converted to Lexical before save; `![alt](https://...)` or `![alt](data:...)` becomes inline wb-image nodes.'
          ),
        projectId: z
          .string()
          .optional()
          .describe('Optional project ID to associate the issue with.'),
        teamId: z
          .string()
          .optional()
          .describe(
            'Optional team ID. When provided, the issue is created under this team.'
          ),
        parentIssueId: z
          .string()
          .optional()
          .describe('Optional parent issue ID to nest this as a sub-issue.'),
      },
    },
    async ({ title, description, projectId, teamId, parentIssueId }) => {
      try {
        const descriptionWithSource = buildElaborateDescription(
          title,
          description
        )
        const lexicalDescription = mcpContentToStoredLexical(
          descriptionWithSource
        )

        const payload: {
          title: string
          description?: string
          projectId?: string
          teamId?: string
          parentIssueId?: string
        } = { title, description: lexicalDescription }
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
  server.registerTool(
    'createSubIssue',
    {
      description:
        'Create a new sub-issue under an existing parent issue. Use this (not createIssue) when nesting work under a parent. The parent must already exist—use parentIssueId from a prior successful createIssue (or getIssue). After bulk parent creation, add all sub-issues for one parent before moving to the next parent.',
      inputSchema: {
        title: z.string().min(1).describe('The sub-issue title.'),
        description: z
          .string()
          .optional()
          .describe(
            'Optional description (Markdown or Lexical JSON); images in Markdown become wb-image nodes.'
          ),
        projectId: z
          .string()
          .optional()
          .describe(
            'Optional project ID. If provided, it should match the parent issue project.'
          ),
        parentIssueId: z
          .string()
          .min(1)
          .describe('Required parent issue ID to attach this sub-issue to.'),
      },
    },
    async ({ title, description, projectId, parentIssueId }) => {
      try {
        const descriptionWithSource = buildElaborateDescription(
          title,
          description
        )
        const lexicalDescription = mcpContentToStoredLexical(
          descriptionWithSource
        )

        const payload: {
          title: string
          description?: string
          projectId?: string
          parentIssueId: string
        } = {
          title,
          description: lexicalDescription,
          parentIssueId,
        }
        if (projectId != null && projectId !== '') {
          payload.projectId = projectId
        }

        const path = '/issues'
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
        logMcpError(error, 'tools.createSubIssue', { title, parentIssueId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create sub-issue in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}
