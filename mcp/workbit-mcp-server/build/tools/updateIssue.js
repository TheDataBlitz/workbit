import { z } from 'zod';
import { makeWorkbitPatchRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { IssueId, ProjectId } from './schema.js';
export function registerUpdateIssueTool(server) {
    server.registerTool('updateIssue', {
        description: 'Update issue.',
        inputSchema: {
            issueId: IssueId,
            status: z.string().optional(),
            assigneeId: z.string().optional(),
            assigneeName: z.string().optional(),
            projectId: ProjectId.nullable().optional(),
            description: z.string().optional(),
            parentIssueId: IssueId.nullable().optional(),
        },
    }, async ({ issueId, status, assigneeId, assigneeName, projectId, description, parentIssueId, }) => {
        try {
            const payload = {};
            if (status !== undefined)
                payload.status = status;
            if (assigneeId !== undefined)
                payload.assigneeId = assigneeId;
            if (assigneeName !== undefined)
                payload.assigneeName = assigneeName;
            if (projectId !== undefined)
                payload.projectId = projectId;
            if (description !== undefined)
                payload.description = description;
            if (parentIssueId !== undefined)
                payload.parentIssueId = parentIssueId;
            if (Object.keys(payload).length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No fields to update. Provide at least one of: status, assigneeId, assigneeName, projectId, description, parentIssueId.',
                        },
                    ],
                };
            }
            const result = await makeWorkbitPatchRequest(`/issues/${encodeURIComponent(issueId)}`, payload);
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
            logMcpError(error, 'tools.updateIssue', { issueId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to update issue in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
