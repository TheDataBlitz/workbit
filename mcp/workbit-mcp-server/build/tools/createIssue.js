import { z } from 'zod';
import { makeWorkbitPostRequest, makeWorkbitRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { IssueId, ProjectId } from './schema.js';
function countWords(input) {
    return input.trim().split(/\s+/).filter(Boolean).length;
}
function buildElaborateDescription(title, description) {
    const createdByLine = 'Created by: AI Generated';
    const userText = (description ?? '').trim();
    const base = userText.length > 0
        ? userText
        : `Deliver the "${title}" work item with clear implementation details and expected outcome.`;
    // Ensure generated descriptions are substantial and actionable.
    if (countWords(base) >= 40) {
        return `${createdByLine}\n\n${base}`;
    }
    return `${createdByLine}

Context:
${base}

Implementation outline:
- Define the scope and key deliverables for "${title}".
- Break work into concrete implementation steps with dependencies.
- Note edge cases, constraints, and assumptions relevant to execution.

Acceptance criteria:
- Outcome is testable and aligned with project goals.
- Required dependencies, risks, and follow-up items are documented.
- Completion state and next steps are clear.`;
}
export function registerCreateIssueTool(server) {
    server.registerTool('createIssue', {
        description: 'Create issue (project-scoped).',
        inputSchema: {
            title: z.string(),
            description: z.string().optional(),
            projectId: ProjectId.optional(),
            projectName: z.string().optional(),
            parentIssueId: IssueId.optional(),
        },
    }, async ({ title, description, projectId, projectName, parentIssueId }) => {
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
                            text: JSON.stringify({ ok: false, error: 'projectId is required to create an issue.' }, null, 2),
                        },
                    ],
                };
            }
            const descriptionWithSource = buildElaborateDescription(title, description);
            const payload = { title, description: descriptionWithSource, projectId: effectiveProjectId };
            if (parentIssueId != null && parentIssueId !== '') {
                payload.parentIssueId = parentIssueId;
            }
            const issue = await makeWorkbitPostRequest('/issues', payload);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(issue, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.createIssue', { title, projectId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to create issue in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
