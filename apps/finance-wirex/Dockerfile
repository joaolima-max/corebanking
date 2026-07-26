# Build from repo root:  docker build -f apps/finance-wirex/Dockerfile --build-arg NEXT_PUBLIC_API_URL=https://api.seu-dominio.com .
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS builder
COPY . .
RUN pnpm install --frozen-lockfile
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN pnpm --filter @bass/finance-wirex build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/apps/finance-wirex/.next/standalone ./
COPY --from=builder /app/apps/finance-wirex/.next/static ./apps/finance-wirex/.next/static
COPY --from=builder /app/apps/finance-wirex/public ./apps/finance-wirex/public
EXPOSE 3003
CMD ["node", "apps/finance-wirex/server.js"]
