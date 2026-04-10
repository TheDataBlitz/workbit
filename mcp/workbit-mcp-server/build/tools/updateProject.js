import { z } from 'zod';
import { makeWorkbitPatchRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
export function registerUpdateProjectTool(server) {
    server.registerTool('updateProject', {
        description: "Update a team's project properties. Provide the team ID and any properties to update (status, priority, dates, etc.).",
        inputSchema: {
            teamId: z
                .string()
                .min(1)
                .describe('The team ID that owns the project to update.'),
            status: z
                .string()
                .optional()
                .describe("Optional project status (e.g. 'on-track', 'at-risk', 'off-track')."),
            priority: z.string().optional().describe('Optional priority.'),
            leadId: z.string().optional().describe('Optional lead member ID.'),
            startDate: z
                .string()
                .optional()
                .describe('Optional start date (e.g. ISO date).'),
            endDate: z
                .string()
                .optional()
                .describe('Optional end date (e.g. ISO date).'),
            memberIds: z
                .array(z.string())
                .optional()
                .describe('Optional list of member IDs.'),
            teamIds: z
                .array(z.string())
                .optional()
                .describe('Optional list of team IDs.'),
            labelIds: z
                .array(z.string())
                .optional()
                .describe('Optional list of label IDs.'),
        },
    }, async ({ teamId, status, priority, leadId, startDate, endDate, memberIds, teamIds, labelIds, }) => {
        try {
            const payload = {};
            if (status !== undefined)
                payload.status = status;
            if (priority !== undefined)
                payload.priority = priority;
            if (leadId !== undefined)
                payload.leadId = leadId;
            if (startDate !== undefined)
                payload.startDate = startDate;
            if (endDate !== undefined)
                payload.endDate = endDate;
            if (memberIds !== undefined)
                payload.memberIds = memberIds;
            if (teamIds !== undefined)
                payload.teamIds = teamIds;
            if (labelIds !== undefined)
                payload.labelIds = labelIds;
            if (Object.keys(payload).length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No fields to update. Provide at least one of: status, priority, leadId, startDate, endDate, memberIds, teamIds, labelIds.',
                        },
                    ],
                };
            }
            const result = await makeWorkbitPatchRequest(`/teams/${encodeURIComponent(teamId)}/project`, payload);
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
            logMcpError(error, 'tools.updateProject', { teamId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to update project in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
export function registerUpdateProjectStatusTool(server) {
    server.registerTool('updateProjectStatus', {
        description: "Update only a team's project status (e.g. 'on-track', 'at-risk', 'off-track').",
        inputSchema: {
            teamId: z
                .string()
                .min(1)
                .describe('The team ID that owns the project to update.'),
            status: z
                .string()
                .min(1)
                .describe("Project status (e.g. 'on-track', 'at-risk', 'off-track')."),
        },
    }, async ({ teamId, status }) => {
        try {
            const result = await makeWorkbitPatchRequest(`/teams/${encodeURIComponent(teamId)}/project`, { status });
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
            logMcpError(error, 'tools.updateProjectStatus', { teamId, status });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to update project status in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
