import { z } from 'zod';
import { makeWorkbitPostRequest, makeWorkbitRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { ProjectHealthStatus, ProjectId, TeamId } from './schema.js';
export function registerCreateProjectStatusUpdateTool(server) {
    server.registerTool('createProjectStatusUpdate', {
        description: 'Create project update.',
        inputSchema: {
            teamId: TeamId.optional(),
            projectId: ProjectId,
            content: z.string().min(1),
            status: ProjectHealthStatus.optional(),
        },
    }, async ({ teamId, projectId, content, status }) => {
        try {
            let resolvedTeamId = (teamId ?? '').trim();
            if (!resolvedTeamId) {
                const projects = await makeWorkbitRequest('/workspace/projects');
                const match = Array.isArray(projects) &&
                    projects.find((p) => p &&
                        typeof p === 'object' &&
                        p?.id === projectId);
                let teamIdFromProject = '';
                if (match && typeof match === 'object') {
                    const raw = match?.teamId;
                    teamIdFromProject = typeof raw === 'string' ? raw.trim() : '';
                }
                resolvedTeamId = teamIdFromProject;
                if (!resolvedTeamId) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Unable to resolve team for this project. Please provide `teamId`, or ensure the project has a team.',
                            },
                        ],
                    };
                }
            }
            const payload = {
                content,
                projectId,
                status: status ?? 'on-track',
            };
            const update = await makeWorkbitPostRequest(`/teams/${encodeURIComponent(resolvedTeamId)}/project/updates`, payload);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(update, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.createProjectStatusUpdate', {
                teamId,
                projectId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to create project status update in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
