# syntax=docker/dockerfile:1.7

# Build from the vendored upstream source in ./upstream

FROM node:22-bullseye AS builder

WORKDIR /app/upstream

# Install bun (required by upstream build scripts)
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Install pnpm (upstream uses pnpm)
RUN corepack enable && corepack prepare pnpm@10.11.0 --activate

COPY upstream/package.json upstream/pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY upstream/ ./
RUN pnpm run build

# ---- runtime ----
FROM node:22-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# server entry is dist/index.js (built with bun, target node)
COPY --from=builder /app/upstream/dist ./dist

# Default port per upstream; can override with PORT
ENV PORT=3001
EXPOSE 3001

CMD ["node", "dist/index.js"]

