import { z } from 'zod';
import { makeWorkbitRequest } from '../utils/workbitClient.js';
import { makeWorkbitPostRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
export function registerGetDecisionTool(server) {
    server.registerTool('getDecision', {
        description: 'Get a specific decision from a project by decision ID.',
        inputSchema: {
            projectId: z
                .string()
                .min(1)
                .describe('The project ID containing the decision.'),
            decisionId: z.string().min(1).describe('The decision ID to fetch.'),
        },
    }, async ({ projectId, decisionId }) => {
        try {
            const response = await makeWorkbitRequest(`/projects/${encodeURIComponent(projectId)}/decisions?pageSize=200`);
            const items = Array.isArray(response?.items) ? response.items : [];
            const decision = items.find((d) => d &&
                typeof d === 'object' &&
                d.id === decisionId);
            const result = decision ?? {
                error: `Decision not found for id: ${decisionId}`,
            };
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
            logMcpError(error, 'tools.getDecision', { projectId, decisionId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch decision from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('getProjectDecisions', {
        description: 'Get all decisions for a given project.',
        inputSchema: {
            projectId: z
                .string()
                .min(1)
                .describe('The project ID to fetch decisions for.'),
            status: z
                .enum(['proposed', 'approved', 'rejected', 'superseded', 'all'])
                .optional()
                .describe('Optional status filter (defaults to all).'),
            type: z
                .enum(['major', 'minor', 'all'])
                .optional()
                .describe('Optional type filter (defaults to all).'),
            limit: z
                .number()
                .int()
                .positive()
                .optional()
                .describe('Optional limit on number of results.'),
        },
    }, async ({ projectId, status, type, limit }) => {
        try {
            let path = `/projects/${encodeURIComponent(projectId)}/decisions`;
            const params = [];
            if (status && status !== 'all') {
                params.push(`status=${encodeURIComponent(status)}`);
            }
            if (type && type !== 'all') {
                params.push(`type=${encodeURIComponent(type)}`);
            }
            if (limit) {
                params.push(`pageSize=${limit}`);
            }
            if (params.length > 0) {
                path += `?${params.join('&')}`;
            }
            const decisions = await makeWorkbitRequest(path);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(decisions, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getProjectDecisions', {
                projectId,
                status,
                type,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch decisions from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('createProjectDecision', {
        description: 'Create a new decision for a project (alias tool for project-scoped decision creation).',
        inputSchema: {
            projectId: z
                .string()
                .min(1)
                .describe('The project ID where the decision will be created.'),
            title: z.string().min(1).describe('The decision title.'),
            type: z
                .enum(['major', 'minor'])
                .describe('Decision type: major or minor.'),
            status: z
                .enum(['proposed', 'approved', 'rejected', 'superseded'])
                .optional()
                .describe('Optional status (defaults to proposed in API).'),
            rationale: z
                .string()
                .min(1)
                .describe('Why this decision is being made.'),
            impact: z
                .string()
                .optional()
                .describe('Optional impact and implications of this decision.'),
            decisionDate: z
                .string()
                .optional()
                .describe('Optional ISO date (e.g. 2026-03-22).'),
            tags: z
                .array(z.string())
                .optional()
                .describe('Optional tags as an array of strings.'),
            linkedIssueIds: z
                .array(z.string())
                .optional()
                .describe('Optional related issue IDs.'),
        },
    }, async ({ projectId, title, type, status, rationale, impact, decisionDate, tags, linkedIssueIds, }) => {
        try {
            const payload = {
                title,
                type,
                rationale,
            };
            if (status !== undefined)
                payload.status = status;
            if (impact !== undefined)
                payload.impact = impact;
            if (decisionDate !== undefined)
                payload.decisionDate = decisionDate;
            if (tags !== undefined)
                payload.tags = tags;
            if (linkedIssueIds !== undefined)
                payload.linkedIssueIds = linkedIssueIds;
            const decision = await makeWorkbitPostRequest(`/projects/${encodeURIComponent(projectId)}/decisions`, payload);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(decision, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.createProjectDecision', { projectId, title });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to create project decision in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
