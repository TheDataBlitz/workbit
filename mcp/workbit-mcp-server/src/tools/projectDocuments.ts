import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import {
  finalizeDocumentContentField,
  mcpContentToStoredLexical,
} from '../utils/mcpLexicalContent.js'
import {
  makeWorkbitPostRequest,
  makeWorkbitPatchRequest,
  makeWorkbitRequest,
} from '../utils/workbitClient.js'
import { logMcpError } from '../logging.js'

export function registerProjectDocumentTools(server: McpServer): void {
  server.registerTool(
    'getProjectDocuments',
    {
      description:
        'List documentation pages for a project (project documents).',
      inputSchema: {
        projectId: z.string().min(1).describe('The project ID.'),
      },
    },
    async ({ projectId }) => {
      try {
        const docs = await makeWorkbitRequest<unknown[]>(
          `/projects/${encodeURIComponent(projectId)}/documents`
        )
        const normalized = Array.isArray(docs)
          ? docs.map((d) => finalizeDocumentContentField(d))
          : docs
        return {
          content: [
            { type: 'text', text: JSON.stringify(normalized, null, 2) },
          ],
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
      description: 'Fetch a single documentation page for a project.',
      inputSchema: {
        projectId: z.string().min(1).describe('The project ID.'),
        documentId: z.string().min(1).describe('The document ID.'),
      },
    },
    async ({ projectId, documentId }) => {
      try {
        const doc = await makeWorkbitRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`
        )
        const normalized = finalizeDocumentContentField(doc)
        return {
          content: [
            { type: 'text', text: JSON.stringify(normalized, null, 2) },
          ],
        }
      } catch (error) {
        logMcpError(error, 'tools.getProjectDocument', {
          projectId,
          documentId,
        })
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
      description: 'Create a new documentation page for a project.',
      inputSchema: {
        projectId: z.string().min(1).describe('The project ID.'),
        title: z.string().min(1).describe('Document title.'),
        content: z
          .string()
          .min(1)
          .describe(
            'Document body as Markdown, plain text, or Lexical JSON; stored as Lexical with `![alt](url)` promoted to wb-image nodes.'
          ),
      },
    },
    async ({ projectId, title, content }) => {
      try {
        const doc = await makeWorkbitPostRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/documents`,
          { title, content: mcpContentToStoredLexical(content) }
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
      description:
        'Update (patch) an existing documentation page for a project.',
      inputSchema: {
        projectId: z.string().min(1).describe('The project ID.'),
        documentId: z.string().min(1).describe('The document ID.'),
        title: z.string().optional().describe('New document title (optional).'),
        content: z
          .string()
          .optional()
          .describe(
            'New body (Markdown, plain text, or Lexical JSON); normalized like createProjectDocument.'
          ),
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
        if (content !== undefined)
          body.content = mcpContentToStoredLexical(content)

        const doc = await makeWorkbitPatchRequest<unknown>(
          `/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`,
          body
        )
        return {
          content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }],
        }
      } catch (error) {
        logMcpError(error, 'tools.updateProjectDocument', {
          projectId,
          documentId,
        })
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
