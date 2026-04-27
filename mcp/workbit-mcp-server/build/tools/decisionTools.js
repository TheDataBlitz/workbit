import { z } from 'zod';
import { makeWorkbitPatchRequest, makeWorkbitPostRequest, makeWorkbitRequest, } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { DecisionId, DecisionStatus, DecisionType, ProjectId, } from './schema.js';
export function registerDecisionTools(server) {
    // ----------------------------
    // createDecision
    // ----------------------------
    server.registerTool('createDecision', {
        description: 'Create decision.',
        inputSchema: {
            projectId: ProjectId.optional(),
            projectName: z.string().optional(),
            title: z.string(),
            type: DecisionType,
            status: DecisionStatus.optional(),
            rationale: z.string(),
            impact: z.string().optional(),
            decisionDate: z.string().optional(),
            tags: z.array(z.string()).optional(),
            linkedIssueIds: z.array(z.string()).optional(),
        },
    }, async ({ projectId, projectName, title, type, status, rationale, impact, decisionDate, tags, linkedIssueIds, }) => {
        try {
            let effectiveProjectId = (projectId ?? '').trim();
            if (!effectiveProjectId) {
                const projects = await makeWorkbitRequest('/workspace/projects');
                const q = (projectName ?? '').trim().toLowerCase();
                const match = q && Array.isArray(projects)
                    ? projects.find((p) => {
                        if (!p || typeof p !== 'object')
                            return false;
                        const name = p.name;
                        return typeof name === 'string'
                            ? name.toLowerCase().includes(q)
                            : false;
                    })
                    : undefined;
                const id = match && typeof match.id === 'string' ? String(match.id) : '';
                effectiveProjectId = id.trim();
            }
            if (!effectiveProjectId) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ ok: false, error: 'projectId is required to create a decision.' }, null, 2),
                        },
                    ],
                };
            }
            const payload = {
                title,
                type,
                rationale,
            };
            if (status)
                payload.status = status;
            if (impact)
                payload.impact = impact;
            if (decisionDate)
                payload.decisionDate = decisionDate;
            if (tags && tags.length > 0)
                payload.tags = tags;
            if (linkedIssueIds && linkedIssueIds.length > 0)
                payload.linkedIssueIds = linkedIssueIds;
            const path = `/projects/${encodeURIComponent(effectiveProjectId)}/decisions`;
            const decision = await makeWorkbitPostRequest(path, payload);
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
            logMcpError(error, 'tools.createDecision', { projectId, title });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to create decision in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    // ----------------------------
    // getDecision / getProjectDecisions
    // ----------------------------
    server.registerTool('getDecision', {
        description: 'Get decision.',
        inputSchema: {
            projectId: ProjectId,
            decisionId: DecisionId,
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
        description: 'List project decisions.',
        inputSchema: {
            projectId: ProjectId,
            status: DecisionStatus.or(z.literal('all')).optional(),
            type: DecisionType.or(z.literal('all')).optional(),
            limit: z.number().int().positive().optional(),
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
    // ----------------------------
    // updateProjectDecision
    // ----------------------------
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
