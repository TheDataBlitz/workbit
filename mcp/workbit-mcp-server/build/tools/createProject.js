import { z } from 'zod';
import { makeWorkbitPostRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { TeamId } from './schema.js';
export function registerCreateProjectTool(server) {
    server.registerTool('createProject', {
        description: 'Create project.',
        inputSchema: {
            name: z.string().min(1),
            description: z.string().optional(),
            teamId: TeamId,
            status: z.string().optional(),
        },
    }, async ({ name, description, teamId, status }) => {
        try {
            const payload = {
                name,
                teamId,
            };
            if (description != null && description !== '') {
                payload.description = description;
            }
            if (status != null && status !== '') {
                payload.status = status;
            }
            const result = await makeWorkbitPostRequest('/workspace/projects', payload);
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
            logMcpError(error, 'tools.createProject', { name, teamId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to create project in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
