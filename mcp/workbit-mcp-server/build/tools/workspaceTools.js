import { z } from 'zod';
import { makeWorkbitPatchRequest, makeWorkbitPostRequest, makeWorkbitRequest, } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { MemberId, WorkspaceId } from './schema.js';
function slugify(input) {
    return input
        .trim()
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .replaceAll(/^-+|-+$/g, '');
}
async function getMeMemberId() {
    try {
        const me = await makeWorkbitRequest('/me/member');
        if (me && typeof me === 'object') {
            const id = me.id;
            if (typeof id === 'string' && id.trim())
                return id.trim();
        }
    }
    catch {
        // ignore
    }
    return null;
}
export function registerWorkspaceTools(server) {
    server.registerTool('getWorkspaces', {
        description: 'List workspaces for a member.',
        inputSchema: {
            memberId: MemberId,
        },
    }, async ({ memberId }) => {
        try {
            const list = await makeWorkbitRequest(`/workspaces?memberId=${encodeURIComponent(memberId)}`);
            return {
                content: [{ type: 'text', text: JSON.stringify(list, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getWorkspaces', { memberId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch workspaces from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('createWorkspace', {
        description: 'Create workspace.',
        inputSchema: {
            name: z.string(),
            slug: z.string().optional(),
            region: z.string().optional(),
            memberId: MemberId.optional(),
        },
    }, async ({ name, slug, region, memberId }) => {
        try {
            const effectiveMemberId = memberId?.trim() || (await getMeMemberId()) || '';
            const effectiveSlug = (slug ?? '').trim() || slugify(name);
            if (!effectiveMemberId) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                ok: false,
                                error: 'memberId is required to create a workspace (could not resolve from /me/member).',
                            }, null, 2),
                        },
                    ],
                };
            }
            if (!effectiveSlug) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({ ok: false, error: 'slug is required to create a workspace.' }, null, 2),
                        },
                    ],
                };
            }
            const created = await makeWorkbitPostRequest('/workspaces', {
                name,
                slug: effectiveSlug,
                region,
                memberId: effectiveMemberId,
            });
            return {
                content: [{ type: 'text', text: JSON.stringify(created, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.createWorkspace', { slug, memberId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to create workspace in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('updateWorkspace', {
        description: 'Update workspace.',
        inputSchema: {
            workspaceId: WorkspaceId,
            name: z.string().optional(),
            slug: z.string().optional(),
            region: z.string().optional(),
        },
    }, async ({ workspaceId, name, slug, region }) => {
        try {
            const payload = {};
            if (name !== undefined)
                payload.name = name;
            if (slug !== undefined)
                payload.slug = slug;
            if (region !== undefined)
                payload.region = region;
            if (Object.keys(payload).length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'No fields to update. Provide at least one of: name, slug, region.',
                        },
                    ],
                };
            }
            const updated = await makeWorkbitPatchRequest(`/workspaces/${encodeURIComponent(workspaceId)}`, payload);
            return {
                content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.updateWorkspace', { workspaceId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to update workspace in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
