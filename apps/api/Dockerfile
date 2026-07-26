# Build from repo root:  docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat curl
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

ENV NODE_ENV=production
WORKDIR /app/apps/api
EXPOSE 3000
# Apply DB migrations, then start the API.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
