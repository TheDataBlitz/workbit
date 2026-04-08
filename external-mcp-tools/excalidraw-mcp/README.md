## Excalidraw MCP (external)

Upstream: `excalidraw/excalidraw-mcp` (cloned into `upstream/`).

This MCP server exposes an HTTP MCP endpoint at `/mcp` (see upstream `src/main.ts`) and can be deployed as a Docker container.

### Build & run (local)

From repo root:

```bash
docker build -f external-mcp-tools/excalidraw-mcp/deploy/Dockerfile -t workbit-excalidraw-mcp:local external-mcp-tools/excalidraw-mcp
docker run --rm -p 3005:3001 -e PORT=3001 workbit-excalidraw-mcp:local
```

Then configure IntegrationBits base URL as:

- `http://<host>:3005/mcp`

### Deployment (EC2)

Use `external-mcp-tools/excalidraw-mcp/deploy/docker-compose.yml` as a starting point.

