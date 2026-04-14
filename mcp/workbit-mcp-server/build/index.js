import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGetProjectTool } from './tools/getProject.js';
import { registerGetIssueTool } from './tools/getIssue.js';
import { registerGetDecisionTool } from './tools/getDecision.js';
import { registerCreateIssueTool } from './tools/createIssue.js';
import { registerCreateProjectTool } from './tools/createProject.js';
import { registerCreateDecisionTool } from './tools/createDecision.js';
import { registerCreateProjectStatusUpdateTool } from './tools/createProjectStatusUpdate.js';
import { registerProjectUpdateTools } from './tools/projectUpdates.js';
import { registerUpdateIssueTool } from './tools/updateIssue.js';
import { registerUpdateProjectTool, registerUpdateProjectStatusTool, } from './tools/updateProject.js';
import { registerUpdateProjectDecisionTool } from './tools/updateDecision.js';
import { registerProjectDocumentTools } from './tools/projectDocuments.js';
import { registerAddTeamMemberTool } from './tools/teamMembers.js';
import { registerAddTeamMembersToProjectTool, registerAssignProjectLeadTool, } from './tools/projectMembership.js';
import { registerOnboardMemberTool } from './tools/onboardMember.js';
import { initLogging, logMcpError } from './logging.js';
const server = new McpServer({
    name: 'workbit',
    version: '1.0.0',
});
registerGetProjectTool(server);
registerGetIssueTool(server);
registerGetDecisionTool(server);
registerCreateIssueTool(server);
registerCreateProjectTool(server);
registerCreateDecisionTool(server);
registerCreateProjectStatusUpdateTool(server);
registerProjectUpdateTools(server);
registerUpdateIssueTool(server);
registerUpdateProjectTool(server);
registerUpdateProjectStatusTool(server);
registerUpdateProjectDecisionTool(server);
registerProjectDocumentTools(server);
registerAddTeamMemberTool(server);
registerAddTeamMembersToProjectTool(server);
registerAssignProjectLeadTool(server);
registerOnboardMemberTool(server);
async function main() {
    initLogging();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    // Keep a stderr message for quick diagnostics in dev
    console.error('Workbit MCP Server running on stdio');
}
main().catch((error) => {
    logMcpError(error, 'mcp.main');
    console.error('Fatal error in main():', error);
    process.exit(1);
});
