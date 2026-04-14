import { makeWorkbitPostRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { MemberId, ProjectId } from './schema.js';
export function registerAddTeamMembersToProjectTool(server) {
    server.registerTool('addTeamMembersToProject', {
        description: 'Sync project members.',
        inputSchema: {
            projectId: ProjectId,
        },
    }, async ({ projectId }) => {
        try {
            const result = await makeWorkbitPostRequest(`/projects/${encodeURIComponent(projectId)}/members/from-team`, {});
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.addTeamMembersToProject', { projectId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to add team members to project in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
export function registerAssignProjectLeadTool(server) {
    server.registerTool('assignProjectLead', {
        description: 'Set project lead.',
        inputSchema: {
            projectId: ProjectId,
            leadId: MemberId.optional(),
        },
    }, async ({ projectId, leadId }) => {
        try {
            const trimmed = (leadId ?? '').trim();
            const result = await makeWorkbitPostRequest(`/projects/${encodeURIComponent(projectId)}/lead`, { leadId: trimmed });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.assignProjectLead', { projectId, leadId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to assign project lead in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
