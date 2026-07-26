#!/usr/bin/env bash
#
# dev-up.sh — sobe o baseline de desenvolvimento e o deixa pronto para uso.
#
# Fluxo (caminho Docker, recomendado):
#   1. Sobe infra de dev (Postgres, Redis, Adminer) via docker compose
#   2. Aguarda o Postgres ficar healthy
#   3. Aplica as migrations do Prisma
#   4. Roda o seed (org Bass, RBAC, chart of accounts, usuário admin)
#   5. Instrui a iniciar a API
#
# Uso:
#   ./scripts/dev-up.sh
#   pnpm dev            # em seguida, para subir API (:3000) + web (:3001)
#
# Requisitos: docker + docker compose, node >= 20, pnpm >= 9.
# A API lê configuração de process.env (ConfigModule usa ignoreEnvFile: true),
# portanto exporte as variáveis abaixo no seu shell ou use `pnpm dev` que as herda.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

: "${DATABASE_URL:=postgresql://corebanking:corebanking@localhost:5432/corebanking_dev?schema=public}"
: "${DIRECT_URL:=postgresql://corebanking:corebanking@localhost:5432/corebanking_dev}"
: "${REDIS_URL:=redis://localhost:6379}"
export DATABASE_URL DIRECT_URL REDIS_URL

echo "▸ Subindo infra de dev (postgres, redis, adminer)…"
docker compose up -d

echo "▸ Aguardando Postgres ficar healthy…"
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U corebanking -d corebanking_dev >/dev/null 2>&1; then
    echo "  ✓ Postgres pronto"
    break
  fi
  sleep 2
  [ "$i" = "30" ] && { echo "  ✗ Postgres não ficou pronto a tempo"; exit 1; }
done

echo "▸ Instalando dependências (pnpm install)…"
pnpm install --frozen-lockfile

echo "▸ Aplicando migrations…"
pnpm --filter api exec prisma migrate deploy

echo "▸ Gerando Prisma Client…"
pnpm --filter api exec prisma generate

echo "▸ Rodando seed…"
pnpm --filter api exec prisma db seed

cat <<'DONE'

✅ Baseline pronto.

   API health : http://localhost:3000/api/health
   Swagger    : http://localhost:3000/api/docs
   Adminer    : http://localhost:8080  (server: postgres)

   Admin:  admin@basspago.com.br  /  Admin@123!

   Próximo passo:
     pnpm dev        # sobe API (:3000) + web (:3001) em watch

   Nota: em dev as chaves JWT são geradas de forma efêmera a cada boot
   (tokens invalidam ao reiniciar). Defina JWT_PRIVATE_KEY/JWT_PUBLIC_KEY
   (PEM RSA) para tokens estáveis.
DONE
