import { z } from 'zod';
import { makeWorkbitRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { ProjectId } from './schema.js';
export function registerGetProjectTool(server) {
    server.registerTool('getProject', {
        description: 'Get project(s).',
        inputSchema: {
            projectId: ProjectId.optional(),
            name: z
                .string()
                .min(1)
                .optional()
                .describe('Optional name filter (case-insensitive).'),
        },
    }, async ({ projectId, name }) => {
        try {
            const projects = await makeWorkbitRequest('/workspace/projects');
            let result = projects;
            const trimmedName = (name ?? '').trim();
            if (trimmedName) {
                if (Array.isArray(projects)) {
                    const q = trimmedName.toLowerCase();
                    result = projects.filter((p) => {
                        if (!p || typeof p !== 'object')
                            return false;
                        const raw = p?.name;
                        const projectName = typeof raw === 'string' ? raw : '';
                        return projectName.toLowerCase().includes(q);
                    });
                }
                else {
                    result = {
                        error: 'Unexpected projects payload; expected an array from /workspace/projects.',
                    };
                }
            }
            if (projectId) {
                if (Array.isArray(projects)) {
                    const match = projects.find((p) => p &&
                        typeof p === 'object' &&
                        p?.id === projectId);
                    result = match ?? {
                        error: `Project not found for id: ${projectId}`,
                    };
                }
                else {
                    result = {
                        error: 'Unexpected projects payload; expected an array from /workspace/projects.',
                    };
                }
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getProject', { projectId, name });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch project(s) from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
