# Build context is the repo root (npm workspaces share one lockfile).
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

# Manifests first so the dependency layer is cached between code changes.
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --workspace apps/api --omit=dev

COPY packages/shared packages/shared
COPY apps/api/src apps/api/src
COPY config config

USER node
WORKDIR /app/apps/api
EXPOSE 3000
# tsx runs the TypeScript directly: no separate build step in the PoC (see DECISIONS.md).
CMD ["node", "--import", "tsx", "src/server.ts"]
