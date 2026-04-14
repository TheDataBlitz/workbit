import { z } from 'zod';
import { finalizeDocumentContentField, mcpContentToStoredLexical, } from '../utils/mcpLexicalContent.js';
import { makeWorkbitPostRequest, makeWorkbitPatchRequest, makeWorkbitRequest, } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { DocumentId, ProjectId } from './schema.js';
export function registerProjectDocumentTools(server) {
    server.registerTool('getProjectDocuments', {
        description: 'List project docs.',
        inputSchema: {
            projectId: ProjectId,
        },
    }, async ({ projectId }) => {
        try {
            const docs = await makeWorkbitRequest(`/projects/${encodeURIComponent(projectId)}/documents`);
            const normalized = Array.isArray(docs)
                ? docs.map((d) => finalizeDocumentContentField(d))
                : docs;
            return {
                content: [
                    { type: 'text', text: JSON.stringify(normalized, null, 2) },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getProjectDocuments', { projectId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch project documents from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('getProjectDocument', {
        description: 'Get project doc.',
        inputSchema: {
            projectId: ProjectId,
            documentId: DocumentId,
        },
    }, async ({ projectId, documentId }) => {
        try {
            const doc = await makeWorkbitRequest(`/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`);
            const normalized = finalizeDocumentContentField(doc);
            return {
                content: [
                    { type: 'text', text: JSON.stringify(normalized, null, 2) },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getProjectDocument', {
                projectId,
                documentId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch project document from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('createProjectDocument', {
        description: 'Create project doc.',
        inputSchema: {
            projectId: ProjectId,
            title: z.string().min(1),
            content: z.string().min(1),
        },
    }, async ({ projectId, title, content }) => {
        try {
            const doc = await makeWorkbitPostRequest(`/projects/${encodeURIComponent(projectId)}/documents`, { title, content: mcpContentToStoredLexical(content) });
            return {
                content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.createProjectDocument', { projectId, title });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to create project document in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('updateProjectDocument', {
        description: 'Update project doc.',
        inputSchema: {
            projectId: ProjectId,
            documentId: DocumentId,
            title: z.string().optional(),
            content: z.string().optional(),
        },
    }, async ({ projectId, documentId, title, content }) => {
        try {
            if (title === undefined && content === undefined) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'At least one of title or content is required.',
                        },
                    ],
                };
            }
            const body = {};
            if (title !== undefined)
                body.title = title;
            if (content !== undefined)
                body.content = mcpContentToStoredLexical(content);
            const doc = await makeWorkbitPatchRequest(`/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(documentId)}`, body);
            return {
                content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.updateProjectDocument', {
                projectId,
                documentId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to update project document in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
