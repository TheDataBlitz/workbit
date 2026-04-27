import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  makeWorkbitPatchRequest,
  makeWorkbitRequest,
} from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import { IssueId, ProjectId } from './schema.js'

type ApiMemberListItem = {
  id: string
  name: string
  username: string
}

type ApiIssueListItem = {
  id: string
  code?: string | null
  title?: string | null
}

async function resolveMemberId(input: {
  assignee?: string
  assigneeId?: string
  assigneeName?: string
}): Promise<
  | { ok: true; assigneeId?: string; assigneeName?: string }
  | { ok: false; error: string; candidates?: Array<{ id: string; name: string; username: string }> }
> {
  const assigneeId = input.assigneeId?.trim()
  if (assigneeId) {
    return { ok: true, assigneeId, assigneeName: input.assigneeName }
  }

  const raw =
    input.assignee?.trim() || input.assigneeName?.trim() || ''
  if (!raw) {
    return { ok: true }
  }

  const members = await makeWorkbitRequest<ApiMemberListItem[]>(
    '/workspace/members'
  )
  const q = raw.toLowerCase()
  const matches = (Array.isArray(members) ? members : []).filter((m) => {
    const name = (m?.name ?? '').trim().toLowerCase()
    const username = (m?.username ?? '').trim().toLowerCase()
    return name === q || username === q || name.includes(q) || username.includes(q)
  })

  if (matches.length === 0) {
    return { ok: false, error: `No member matched assignee "${raw}".` }
  }
  if (matches.length > 1) {
    return {
      ok: false,
      error: `Multiple members matched assignee "${raw}". Provide a more specific username/name.`,
      candidates: matches.slice(0, 8).map((m) => ({
        id: m.id,
        name: m.name,
        username: m.username,
      })),
    }
  }
  return { ok: true, assigneeId: matches[0]!.id, assigneeName: matches[0]!.name }
}

async function resolveIssueId(input: {
  issueId?: string
  issueCode?: string
  title?: string
  projectId?: string | null
}): Promise<
  | { ok: true; issueId: string }
  | { ok: false; error: string; candidates?: Array<{ id: string; code?: string; title?: string }> }
> {
  const direct = input.issueId?.trim()
  if (direct) return { ok: true, issueId: direct }

  const projectId = (input.projectId ?? '').trim()
  if (!projectId) {
    return {
      ok: false,
      error:
        'issueId is required (or provide projectId + issueCode/title to resolve).',
    }
  }

  const rawCode = input.issueCode?.trim() ?? ''
  const rawTitle = input.title?.trim() ?? ''
  if (!rawCode && !rawTitle) {
    return {
      ok: false,
      error:
        'Provide issueId, or (projectId + issueCode/title) to resolve the issue.',
    }
  }

  const issues = await makeWorkbitRequest<ApiIssueListItem[]>(
    `/projects/${encodeURIComponent(projectId)}/issues`
  )
  const list = Array.isArray(issues) ? issues : []

  if (rawCode) {
    const q = rawCode.toLowerCase()
    const matches = list.filter((i) => (i.code ?? '').toLowerCase() === q)
    if (matches.length === 1 && matches[0]?.id?.trim()) {
      return { ok: true, issueId: matches[0]!.id.trim() }
    }
    if (matches.length > 1) {
      return {
        ok: false,
        error: `Multiple issues matched code "${rawCode}".`,
        candidates: matches.slice(0, 8).map((i) => ({
          id: i.id,
          code: i.code ?? undefined,
          title: i.title ?? undefined,
        })),
      }
    }
  }

  if (rawTitle) {
    const q = rawTitle.toLowerCase()
    const matches = list.filter((i) =>
      (i.title ?? '').toLowerCase().includes(q)
    )
    if (matches.length === 1 && matches[0]?.id?.trim()) {
      return { ok: true, issueId: matches[0]!.id.trim() }
    }
    if (matches.length > 1) {
      return {
        ok: false,
        error: `Multiple issues matched title "${rawTitle}".`,
        candidates: matches.slice(0, 8).map((i) => ({
          id: i.id,
          code: i.code ?? undefined,
          title: i.title ?? undefined,
        })),
      }
    }
  }

  return {
    ok: false,
    error: rawCode
      ? `No issue matched code "${rawCode}" in this project.`
      : `No issue matched title "${rawTitle}" in this project.`,
  }
}

export function registerIssueTools(server: McpServer): void {
  server.registerTool(
    'getIssue',
    {
      description: 'Get issue.',
      inputSchema: {
        issueId: IssueId.optional(),
        issueCode: z.string().optional(),
        title: z.string().optional(),
        projectId: ProjectId.nullable().optional(),
      },
    },
    async ({ issueId, issueCode, title, projectId }) => {
      try {
        const resolved = await resolveIssueId({
          issueId,
          issueCode,
          title,
          projectId,
        })
        if (!resolved.ok) {
          return {
            content: [{ type: 'text', text: JSON.stringify(resolved, null, 2) }],
          }
        }
        const issue = await makeWorkbitRequest<unknown>(
          `/issues/${encodeURIComponent(resolved.issueId)}`
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

  server.registerTool(
    'updateIssue',
    {
      description:
        'Update issue. Use issueId, or resolve via projectId + issueCode/title. Prefer `assignee` (name/username).',
      inputSchema: {
        issueId: IssueId.optional(),
        issueCode: z.string().optional(),
        title: z.string().optional(),
        status: z.string().optional(),
        assignee: z.string().optional(),
        assigneeId: z.string().optional(),
        assigneeName: z.string().optional(),
        projectId: ProjectId.nullable().optional(),
        description: z.string().optional(),
        parentIssueId: IssueId.nullable().optional(),
      },
    },
    async ({
      issueId,
      issueCode,
      title,
      status,
      assignee,
      assigneeId,
      assigneeName,
      projectId,
      description,
      parentIssueId,
    }) => {
      try {
        const resolvedIssue = await resolveIssueId({
          issueId,
          issueCode,
          title,
          projectId,
        })
        if (!resolvedIssue.ok) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(resolvedIssue, null, 2),
              },
            ],
          }
        }

        const payload: Record<string, unknown> = {}
        if (status !== undefined) payload.status = status

        const resolved = await resolveMemberId({
          assignee,
          assigneeId,
          assigneeName,
        })
        if (!resolved.ok) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    ok: false,
                    error: resolved.error,
                    candidates: resolved.candidates ?? [],
                  },
                  null,
                  2
                ),
              },
            ],
          }
        }
        if (resolved.assigneeId !== undefined) {
          payload.assigneeId = resolved.assigneeId
          payload.assigneeName = resolved.assigneeName
        } else {
          if (assigneeId !== undefined) payload.assigneeId = assigneeId
          if (assigneeName !== undefined) payload.assigneeName = assigneeName
        }
        if (projectId !== undefined) payload.projectId = projectId
        if (description !== undefined) payload.description = description
        if (parentIssueId !== undefined) payload.parentIssueId = parentIssueId

        if (Object.keys(payload).length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No fields to update. Provide at least one of: status, assigneeId, assigneeName, projectId, description, parentIssueId.',
              },
            ],
          }
        }

        const result = await makeWorkbitPatchRequest<unknown>(
          `/issues/${encodeURIComponent(resolvedIssue.issueId)}`,
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
        logMcpError(error, 'tools.updateIssue', { issueId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to update issue in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}

