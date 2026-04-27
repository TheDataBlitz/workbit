import { z } from 'zod';
import { makeWorkbitPostRequest, makeWorkbitPatchRequest, makeWorkbitRequest, } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { MemberId } from './schema.js';
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
export function registerOnboardMemberTool(server) {
    server.registerTool('getMembers', {
        description: 'Get workspace members (optionally filter by name/username).',
        inputSchema: {
            memberId: MemberId.optional(),
            query: z.string().optional(),
        },
    }, async ({ memberId, query }) => {
        try {
            const members = await makeWorkbitRequest('/workspace/members');
            let result = members;
            const q = (query ?? '').trim().toLowerCase();
            if (q) {
                if (Array.isArray(members)) {
                    result = members.filter((m) => {
                        if (!m || typeof m !== 'object')
                            return false;
                        const name = typeof m.name === 'string' ? m.name : '';
                        const username = typeof m.username === 'string' ? m.username : '';
                        return (name.toLowerCase().includes(q) ||
                            username.toLowerCase().includes(q));
                    });
                }
            }
            if (memberId) {
                if (Array.isArray(members)) {
                    result =
                        members.find((m) => m &&
                            typeof m === 'object' &&
                            m?.id === memberId) ?? { error: `Member not found for id: ${memberId}` };
                }
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.getMembers', { memberId, query });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to fetch members from Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('updateMember', {
        description: 'Update a workspace member (name/username/status/avatarSrc/provisioned).',
        inputSchema: {
            memberId: MemberId,
            name: z.string().optional(),
            username: z.string().optional(),
            status: z.string().optional(),
            avatarSrc: z.string().nullable().optional(),
            provisioned: z.boolean().optional(),
        },
    }, async ({ memberId, name, username, status, avatarSrc, provisioned }) => {
        try {
            const patch = {};
            if (name !== undefined)
                patch.name = name;
            if (username !== undefined)
                patch.username = username;
            if (status !== undefined)
                patch.status = status;
            if (avatarSrc !== undefined)
                patch.avatarSrc = avatarSrc;
            if (provisioned !== undefined)
                patch.provisioned = provisioned;
            const updated = await makeWorkbitPatchRequest(`/workspace/members/${encodeURIComponent(memberId)}`, patch);
            return {
                content: [
                    { type: 'text', text: JSON.stringify({ ok: true, updated }, null, 2) },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.updateMember', { memberId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to update member in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
    server.registerTool('onboardMember', {
        description: 'Onboard member.',
        inputSchema: {
            email: z.string(),
            name: z.string(),
            username: z.string(),
            status: z.string().optional(),
        },
    }, async ({ email, name, username, status }) => {
        const emailNorm = normalizeEmail(email);
        try {
            // Best-effort: avoid duplicates by checking existing members by username.
            // Note: API member list does not expose email.
            const members = await makeWorkbitRequest('/workspace/members');
            const existingByUsername = Array.isArray(members)
                ? members.find((m) => typeof m?.username === 'string' &&
                    m.username.trim().toLowerCase() ===
                        username.trim().toLowerCase())
                : undefined;
            if (existingByUsername) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                ok: true,
                                alreadyExists: true,
                                member: existingByUsername,
                                note: 'Member already exists (matched by username); no create/invite performed.',
                            }, null, 2),
                        },
                    ],
                };
            }
            const member = await makeWorkbitPostRequest('/workspace/members', {
                email: emailNorm,
                name,
                username,
                status,
            });
            const invitation = await makeWorkbitPostRequest('/workspace/members/invite', { email: emailNorm });
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ ok: true, member, invitation }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.onboardMember', {
                email: emailNorm,
                username,
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to onboard member in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
