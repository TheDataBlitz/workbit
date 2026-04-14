import { z } from 'zod';
import { makeWorkbitPatchRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { DecisionId, DecisionStatus, DecisionType, ProjectId, } from './schema.js';
export function registerUpdateProjectDecisionTool(server) {
    server.registerTool('updateProjectDecision', {
        description: 'Update decision.',
        inputSchema: {
            projectId: ProjectId,
            decisionId: DecisionId,
            title: z.string().optional(),
            type: DecisionType.optional(),
            rationale: z.string().optional(),
            impact: z.string().optional(),
            decisionDate: z.string().optional(),
            status: DecisionStatus.optional(),
            tags: z.array(z.string()).optional(),
            linkedIssueIds: z.array(z.string()).optional(),
        },
    }, async ({ projectId, decisionId, title, type, rationale, impact, decisionDate, status, tags, linkedIssueIds, }) => {
        try {
            const payload = {};
            if (title !== undefined)
                payload.title = title;
            if (type !== undefined)
                payload.type = type;
            if (rationale !== undefined)
                payload.rationale = rationale;
            if (impact !== undefined)
                payload.impact = impact;
            if (decisionDate !== undefined)
                payload.decisionDate = decisionDate;
            if (status !== undefined)
                payload.status = status;
            if (tags !== undefined)
                payload.tags = tags;
            if (linkedIssueIds !== undefined)
                payload.linkedIssueIds = linkedIssueIds;
            if (Object.keys(payload).length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No fields to update. Provide at least one decision field.',
                        },
                    ],
                };
            }
            const updated = await makeWorkbitPatchRequest(`/projects/${encodeURIComponent(projectId)}/decisions/${encodeURIComponent(decisionId)}`, payload);
            return {
                content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.updateProjectDecision', {
                projectId,
                decisionId,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to update project decision in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
