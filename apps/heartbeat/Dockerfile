# Heartbeat daemon Docker image — monorepo'dan tsx runtime ile paketler.
# Bağlam repo root: `docker build -f apps/heartbeat/Dockerfile .`
#
# `@hashtap/shared` src/*.ts üzerinden sunulduğu için runtime'da da tsx
# kullanıyoruz. Bundling daha sonra gelecek.

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/heartbeat apps/heartbeat

RUN npm ci --workspaces --include-workspace-root --ignore-scripts \
    && npm cache clean --force

USER node

WORKDIR /app/apps/heartbeat

CMD ["npx", "tsx", "src/index.ts"]

