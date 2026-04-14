import { makeWorkbitPostRequest } from '../utils/workbitClient.js';
import { logMcpError } from '../logging.js';
import { MemberId, TeamId } from './schema.js';
export function registerAddTeamMemberTool(server) {
    server.registerTool('addTeamMember', {
        description: 'Add member to team.',
        inputSchema: {
            teamId: TeamId,
            memberId: MemberId,
        },
    }, async ({ teamId, memberId }) => {
        try {
            const result = await makeWorkbitPostRequest(`/teams/${encodeURIComponent(teamId)}/members`, { memberId });
            return {
                content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            };
        }
        catch (error) {
            logMcpError(error, 'tools.addTeamMember', { teamId, memberId });
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to add member to team in Workbit API: ${error.message}`,
                    },
                ],
            };
        }
    });
}
