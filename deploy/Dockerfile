# syntax=docker/dockerfile:1.7
#
# Build from the repository root (parent of api/):
#   docker build -f deploy/Dockerfile -t workbit-api .
#
# Run on a VM (set env for Supabase, keys, etc.):
#   docker run --rm -p 3001:3001 --env-file path/to/api.env workbit-api
#
# Default listen: 0.0.0.0:3001 (see api/src/index.ts). Override with PORT.

FROM node:22-alpine AS builder

WORKDIR /app

COPY api/package.json api/package-lock.json ./
RUN npm ci

COPY api/ ./
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app
USER node

EXPOSE 3001
ENV PORT=3001

CMD ["node", "dist/index.js"]
