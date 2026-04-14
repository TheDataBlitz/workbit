import { z } from 'zod';
import { makeWorkbitPostRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
export function registerAddTeamMembersToProjectTool(server) {
    server.registerTool('addTeamMembersToProject', {
        description: "Add all users in the project's team to the project's member list (project properties).",
        inputSchema: {
            projectId: z.string().min(1).describe('Project ID.'),
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
        description: 'Assign (or clear) the lead for a project in project properties.',
        inputSchema: {
            projectId: z.string().min(1).describe('Project ID.'),
            leadId: z
                .string()
                .optional()
                .describe('Member ID to set as project lead. Omit or pass empty to clear.'),
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
