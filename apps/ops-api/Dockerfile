# Ops-api Docker image — monorepo'dan tsx runtime ile paketler.
# Bağlam (context) repo root olmalı: `docker build -f apps/ops-api/Dockerfile .`
#
# Şu an `@hashtap/shared` kaynaktan (src/*.ts) yayınlanıyor, ayrı build
# emit'i yok. Bu yüzden runtime'da da tsx ile çalıştırıyoruz. Prod'da
# bundle edilmek istenirse (esbuild/rollup) ayrı iş — şimdilik minimal.

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/ops-api apps/ops-api

RUN npm ci --workspaces --include-workspace-root --ignore-scripts \
    && npm cache clean --force

USER node

WORKDIR /app/apps/ops-api

EXPOSE 4100
CMD ["npx", "tsx", "src/index.ts"]

