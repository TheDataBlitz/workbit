import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerCreateIssueTool } from './tools/createIssue.js';
import { registerProjectTools } from './tools/projectTools.js';
import { registerDecisionTools } from './tools/decisionTools.js';
import { registerIssueTools } from './tools/issueTools.js';
import { registerOnboardMemberTool } from './tools/onboardMember.js';
import { registerWorkspaceTools } from './tools/workspaceTools.js';
import { initLogging, logMcpError } from './logging.js';
const server = new McpServer({
    name: 'workbit',
    version: '1.0.0',
});
registerWorkspaceTools(server);
registerProjectTools(server);
registerIssueTools(server);
registerCreateIssueTool(server);
registerDecisionTools(server);
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
