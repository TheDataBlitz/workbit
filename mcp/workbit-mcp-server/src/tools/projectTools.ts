import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  makeWorkbitPostRequest,
  makeWorkbitPatchRequest,
  makeWorkbitRequest,
} from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'
import { DocumentId, MemberId, ProjectHealthStatus, ProjectId } from './schema.js'

async function resolveProjectId(input: {
  projectId?: string
  projectName?: string
}): Promise<
  | { ok: true; projectId: string }
  | { ok: false; error: string; candidates?: Array<{ id: string; name: string }> }
> {
  const pid = input.projectId?.trim()
  if (pid) return { ok: true, projectId: pid }
  const name = input.projectName?.trim()
  if (!name) return { ok: false, error: 'projectId (or projectName) is required.' }

  const projects = await makeWorkbitRequest<unknown[]>('/workspace/projects')
  const q = name.toLowerCase()
  const matches = (Array.isArray(projects) ? projects : []).filter((p) => {
    if (!p || typeof p !== 'object') return false
    const n = (p as { name?: unknown }).name
    return typeof n === 'string' && n.toLowerCase().includes(q)
  })

  if (matches.length === 0) {
    return { ok: false, error: `No project matched "${name}".` }
  }
  if (matches.length > 1) {
    return {
      ok: false,
      error: `Multiple projects matched "${name}".`,
      candidates: matches.slice(0, 8).map((p) => ({
        id: (p as { id?: string }).id ?? '',
        name: (p as { name?: string }).name ?? '',
      })),
    }
  }
  const id = (matches[0] as { id?: unknown }).id
  if (typeof id !== 'string' || !id.trim()) {
    return { ok: false, error: 'Matched project is missing id.' }
  }
  return { ok: true, projectId: id.trim() }
}

export function registerProjectTools(server: McpServer): void {
  // ----------------------------
  // getProject
  // ----------------------------
  server.registerTool(
    'getProject',
    {
      description: 'Get project(s).',
      inputSchema: {
        projectId: ProjectId.optional(),
        name: z
          .string()
          .min(1)
          .optional()
          .describe('Optional name filter (case-insensitive).'),
      },
    },
    async ({ projectId, name }) => {
      try {
        const projects = await makeWorkbitRequest<unknown[]>(
          '/workspace/projects'
        )

        let result: unknown = projects

        const trimmedName = (name ?? '').trim()
        if (trimmedName) {
          if (Array.isArray(projects)) {
            const q = trimmedName.toLowerCase()
            result = projects.filter((p) => {
              if (!p || typeof p !== 'object') return false
              const raw = (p as { name?: unknown })?.name
              const projectName = typeof raw === 'string' ? raw : ''
              return projectName.toLowerCase().includes(q)
            })
          } else {
            result = {
              error:
                'Unexpected projects payload; expected an array from /workspace/projects.',
            }
          }
        }

        if (projectId) {
          if (Array.isArray(projects)) {
            const match = projects.find(
              (p) =>
                p &&
                typeof p === 'object' &&
                (p as { id?: string })?.id === projectId
            )
            result = match ?? {
              error: `Project not found for id: ${projectId}`,
            }
          } else {
            result = {
              error:
                'Unexpected projects payload; expected an array from /workspace/projects.',
            }
          }
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
        logMcpError(error, 'tools.getProject', { projectId, name })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch project(s) from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  // ----------------------------
  // createProject
  // ----------------------------
  server.registerTool(
    'createProject',
    {
      description:
        'Create project. If workspaceId is unknown, call `getWorkspaces` first and match by name/slug (do not ask the user for ids).',
      inputSchema: {
        name: z.string(),
        description: z.string().optional(),
        workspaceId: z.string().optional(),
        workspace: z.string().optional(),
        status: z.string().optional(),
      },
    },
    async ({ name, description, workspaceId, workspace, status }) => {
      try {
        let effectiveWorkspaceId = (workspaceId ?? '').trim()
        if (!effectiveWorkspaceId) {
          const me = await makeWorkbitRequest<unknown>('/me/member')
          const memberId =
            me && typeof me === 'object' && typeof (me as any).id === 'string'
              ? String((me as any).id).trim()
              : ''
          if (memberId) {
            const list = await makeWorkbitRequest<unknown>(
              `/workspaces?memberId=${encodeURIComponent(memberId)}`
            )
            const ws = Array.isArray(list) ? list : []
            const q = (workspace ?? '').trim().toLowerCase()
            const match =
              q && ws.length > 0
                ? ws.find((w) => {
                    if (!w || typeof w !== 'object') return false
                    const name = typeof (w as any).name === 'string' ? (w as any).name : ''
                    const slug = typeof (w as any).slug === 'string' ? (w as any).slug : ''
                    return (
                      name.toLowerCase() === q ||
                      slug.toLowerCase() === q ||
                      name.toLowerCase().includes(q) ||
                      slug.toLowerCase().includes(q)
                    )
                  })
                : undefined
            const wid = match && typeof (match as any).id === 'string' ? String((match as any).id) : ''
            effectiveWorkspaceId = wid.trim()
          }
        }

        if (!effectiveWorkspaceId) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { ok: false, error: 'workspaceId is required to create a project.' },
                  null,
                  2
                ),
              },
            ],
          }
        }

        const payload: {
          name: string
          description?: string
          workspaceId: string
          status?: string
        } = {
          name,
          workspaceId: effectiveWorkspaceId,
        }
        if (description != null && description !== '') {
          payload.description = description
        }
        if (status != null && status !== '') {
          payload.status = status
        }
        const result = await makeWorkbitPostRequest<unknown>(
          '/workspace/projects',
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
        logMcpError(error, 'tools.createProject', { name, workspaceId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create project in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  // ----------------------------
  // createProjectStatusUpdate
  // ----------------------------
  server.registerTool(
    'createProjectStatusUpdate',
    {
      description: 'Create project update.',
      inputSchema: {
        projectId: ProjectId.optional(),
        projectName: z.string().optional(),
        content: z.string(),
        status: ProjectHealthStatus.optional(),
      },
    },
    async ({ projectId, projectName, content, status }) => {
      try {
        const resolved = await resolveProjectId({ projectId, projectName })
        if (!resolved.ok) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(resolved, null, 2),
              },
            ],
          }
        }
        const payload: Record<string, unknown> = {
          content,
          projectId: resolved.projectId,
          status: status ?? 'on-track',
        }
        const update = await makeWorkbitPostRequest<unknown>(
          `/projects/${encodeURIComponent(resolved.projectId)}/status-updates`,
          payload
        )
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(update, null, 2),
            },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.createProjectStatusUpdate', {
          projectId,
        })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create project status update in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  // ----------------------------
  // projectUpdates helpers
  // ----------------------------
  server.registerTool(
    'getProjectStatusUpdates',
    {
      description: 'List status updates.',
      inputSchema: {
        projectId: ProjectId,
      },
    },
    async ({ projectId }) => {
      try {
        const payload = await makeWorkbitRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/status-updates`
        )
        const nodes =
          payload && typeof payload === 'object'
            ? (payload as { nodes?: unknown[] }).nodes
            : undefined
        const updates = Array.isArray(nodes) ? nodes : []
        return {
          content: [{ type: 'text', text: JSON.stringify(updates, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.getProjectStatusUpdates', {
          projectId,
        })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch project status updates from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'getProjectStatusUpdateComments',
    {
      description: 'List status comments.',
      inputSchema: {
        projectId: ProjectId,
        updateId: z.string(),
      },
    },
    async ({ projectId, updateId }) => {
      try {
        const comments = await makeWorkbitRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/status-updates/${encodeURIComponent(updateId)}/comments`
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.getProjectStatusUpdateComments', {
          projectId,
          updateId,
        })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch project status update comments from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'createProjectStatusUpdateComment',
    {
      description: 'Create status comment.',
      inputSchema: {
        projectId: ProjectId,
        updateId: z.string(),
        content: z.string(),
      },
    },
    async ({ projectId, updateId, content }) => {
      try {
        const comment = await makeWorkbitPostRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/status-updates/${encodeURIComponent(updateId)}/comments`,
          { content }
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.createProjectStatusUpdateComment', {
          projectId,
          updateId,
        })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create project status update comment in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  // ----------------------------
  // assignProjectLead
  // ----------------------------
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

  // ----------------------------
  // project documents
  // ----------------------------
  server.registerTool(
    'getProjectDocuments',
    {
      description: 'List project docs.',
      inputSchema: {
        projectId: ProjectId,
      },
    },
    async ({ projectId }) => {
      try {
        const docs = await makeWorkbitRequest<unknown[]>(
          `/projects/${encodeURIComponent(projectId)}/documents`
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(docs, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.getProjectDocuments', { projectId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch project documents from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'getProjectDocument',
    {
      description: 'Get project doc.',
      inputSchema: {
        projectId: ProjectId,
        documentId: DocumentId,
      },
    },
    async ({ projectId, documentId }) => {
      try {
        const doc = await makeWorkbitRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.getProjectDocument', { projectId, documentId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to fetch project document from Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'createProjectDocument',
    {
      description: 'Create project doc.',
      inputSchema: {
        projectId: ProjectId,
        title: z.string().min(1),
        content: z.string().min(1),
      },
    },
    async ({ projectId, title, content }) => {
      try {
        const doc = await makeWorkbitPostRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/documents`,
          { title, content }
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.createProjectDocument', { projectId, title })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to create project document in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )

  server.registerTool(
    'updateProjectDocument',
    {
      description: 'Update project doc.',
      inputSchema: {
        projectId: ProjectId,
        documentId: DocumentId,
        title: z.string().optional(),
        content: z.string().optional(),
      },
    },
    async ({ projectId, documentId, title, content }) => {
      try {
        if (title === undefined && content === undefined) {
          return {
            content: [
              {
                type: 'text',
                text: 'At least one of title or content is required.',
              },
            ],
          }
        }

        const body: Record<string, unknown> = {}
        if (title !== undefined) body.title = title
        if (content !== undefined) body.content = content

        const doc = await makeWorkbitPatchRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
          body
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.updateProjectDocument', { projectId, documentId })
        return {
          content: [
            {
              type: 'text',
              text: `Failed to update project document in Workbit API: ${
                (error as Error).message
              }`,
            },
          ],
        }
      }
    }
  )
}

