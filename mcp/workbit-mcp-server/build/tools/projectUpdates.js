import { z } from 'zod';
import { makeWorkbitPostRequest, makeWorkbitRequest, } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { TeamId } from './schema.js';
export function registerProjectUpdateTools(server) {
    server.registerTool('getProjectStatusUpdates', {
        description: 'List status updates.',
        inputSchema: {
            teamId: TeamId,
            projectId: z.string().optional(),
        },
    }, async ({ teamId, projectId }) => {
        try {
            const teamProject = await makeWorkbitRequest(`/teams/${encodeURIComponent(teamId)}/project`);
            const nodes = teamProject?.project?.statusUpdates?.nodes;
            const updates = Array.isArray(nodes) ? nodes : [];
            const filtered = projectId && projectId.trim() !== ''
                ? updates.filter((u) => u &&
                    typeof u === 'object' &&
                    u.projectId === projectId)
                : updates;
            return {
                content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getProjectStatusUpdates', {
                teamId,
                projectId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch project status updates from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('getProjectStatusComment', {
        description: 'Get status comment.',
        inputSchema: {
            teamId: TeamId,
            updateId: z.string().min(1),
            commentId: z.string().min(1),
        },
    }, async ({ teamId, updateId, commentId }) => {
        try {
            const comments = await makeWorkbitRequest(`/teams/${encodeURIComponent(teamId)}/project/updates/${encodeURIComponent(updateId)}/comments`);
            const item = Array.isArray(comments)
                ? comments.find((c) => c &&
                    typeof c === 'object' &&
                    c.id === commentId)
                : null;
            const result = item ?? {
                error: `Project status comment not found for id: ${commentId}`,
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getProjectStatusComment', {
                teamId,
                updateId,
                commentId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch project status comment from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('getProjectStatusUpdateComments', {
        description: 'List status comments.',
        inputSchema: {
            teamId: TeamId,
            updateId: z.string().min(1),
        },
    }, async ({ teamId, updateId }) => {
        try {
            const comments = await makeWorkbitRequest(`/teams/${encodeURIComponent(teamId)}/project/updates/${encodeURIComponent(updateId)}/comments`);
            return {
                content: [{ type: 'text', text: JSON.stringify(comments, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getProjectStatusUpdateComments', {
                teamId,
                updateId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch project status update comments from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('createProjectStatusUpdateComment', {
        description: 'Create status comment.',
        inputSchema: {
            teamId: TeamId,
            updateId: z.string().min(1),
            content: z.string().min(1),
        },
    }, async ({ teamId, updateId, content }) => {
        try {
            const comment = await makeWorkbitPostRequest(`/teams/${encodeURIComponent(teamId)}/project/updates/${encodeURIComponent(updateId)}/comments`, { content });
            return {
                content: [{ type: 'text', text: JSON.stringify(comment, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.createProjectStatusUpdateComment', {
                teamId,
                updateId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to create project status update comment in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
