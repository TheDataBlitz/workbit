import { z } from 'zod';
import { makeWorkbitPostRequest, makeWorkbitRequest, } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { TeamId } from './schema.js';
function normalizeEmail(email) {
    return email.trim().toLowerCase();
}
export function registerOnboardMemberTool(server) {
    server.registerTool('onboardMember', {
        description: 'Onboard member.',
        inputSchema: {
            email: z.string().min(1),
            name: z.string().min(1),
            username: z.string().min(1),
            status: z.string().optional(),
            teamIds: z.array(TeamId).optional(),
        },
    }, async ({ email, name, username, status, teamIds }) => {
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
                teamIds: teamIds ?? [],
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
