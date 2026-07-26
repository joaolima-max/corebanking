# RUNBOOK — Ambiente de Desenvolvimento (Fase F1)

> Como subir o baseline existente e validá-lo. Corresponde à **Fase F1** do roadmap
> em [`ARCHITECTURE.md`](../ARCHITECTURE.md): *"subir o que já existe em Docker, healthchecks,
> seed, smoke test"*. Este documento registra o procedimento e a **evidência de verificação**.

## Componentes do baseline

| Componente | Porta | Papel |
|---|---|---|
| API (NestJS) | 3000 | REST `/api/v1`, health, Swagger |
| Web (Next.js) | 3001 | Dashboard atual (será substituído na F3) |
| PostgreSQL 16 | 5432 | System-of-record + ledger |
| Redis 7 | 6379 | Cache / rate-limit |
| Adminer | 8080 | UI de DB (dev) |

## Subir (caminho recomendado — Docker)

```bash
./scripts/dev-up.sh     # infra + migrations + seed
pnpm dev                # API (:3000) + web (:3001) em watch
```

A API lê configuração de `process.env` (o `ConfigModule` usa `ignoreEnvFile: true`);
`DATABASE_URL` é a única variável obrigatória. As chaves JWT, se ausentes, são geradas
de forma **efêmera** a cada boot (ver "Gaps conhecidos").

### Credenciais do seed
- **Admin:** `admin@basspago.com.br` / `Admin@123!` (papel `SUPER_ADMIN`)
- **Org:** Bass Pago · chart of accounts com 9 contas · 10 papéis · 20 permissões

## Verificação (smoke test)

```bash
# Health
curl -s http://localhost:3000/api/health
# → {"status":"ok",...}

# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@basspago.com.br","password":"Admin@123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).data.tokens.accessToken))")

# Identidade + RBAC
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/auth/me

# Ledger (leitura)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3000/api/v1/ledger/accounts?orgId=<ORG_ID>"

# Ledger (escrita — double-entry balanceado)
curl -s -X POST "http://localhost:3000/api/v1/ledger/journal-entries" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"orgId":"<ORG_ID>","description":"smoke","idempotencyKey":"k1",
       "lines":[{"ledgerAccountId":"<A1>","direction":"DEBIT","amount":"100.00"},
                {"ledgerAccountId":"<A2>","direction":"CREDIT","amount":"100.00"}]}'
```

### Resultado verificado (2026-07-26)

| Check | Resultado |
|---|---|
| `GET /api/health` | ✅ `200 {"status":"ok"}` |
| `GET /api/docs` (Swagger UI) | ✅ `200` |
| `GET /api/docs-json` (OpenAPI) | ✅ `200` |
| `POST /api/v1/auth/login` | ✅ JWT **RS256** emitido |
| `GET /api/v1/auth/me` | ✅ usuário `SUPER_ADMIN` + permissões |
| `GET /api/v1/ledger/accounts` | ✅ 9 contas seedadas |
| `POST /api/v1/ledger/journal-entries` | ✅ lançamento balanceado `POSTED` |
| `GET /api/v1/dashboard/executive` | ✅ `200` |

**Veredicto F1: baseline funcionando de ponta a ponta.**

## Fallback sem Docker (Postgres/Redis nativos)

Necessário em ambientes onde o **pull de imagens do Docker Hub está bloqueado**
(caso deste sandbox — o CDN da Docker retorna `403` via proxy de egress). O daemon
do Docker roda, mas não baixa imagens; então usam-se serviços nativos:

```bash
# Postgres 16
apt-get install -y postgresql postgresql-contrib
pg_ctlcluster 16 main start
sudo -u postgres psql -c "CREATE ROLE corebanking LOGIN PASSWORD 'corebanking' SUPERUSER;"
sudo -u postgres createdb -O corebanking corebanking_dev
psql -h localhost -U corebanking -d corebanking_dev -f docker/postgres/init.sql

# Redis 7
redis-server --daemonize yes

# App
export DATABASE_URL="postgresql://corebanking:corebanking@localhost:5432/corebanking_dev?schema=public"
export DIRECT_URL="$DATABASE_URL"
export REDIS_URL="redis://localhost:6379"
pnpm install
pnpm --filter api exec prisma migrate deploy
pnpm --filter api exec prisma db seed
pnpm --filter api exec nest build && node apps/api/dist/main
```

## Gaps conhecidos (para a Fase F2 — Hardening)

1. **`apps/api/Dockerfile` ausente** — `docker-compose.prod.yml` referencia
   `dockerfile: apps/api/Dockerfile`, que **não existe**. O build de produção via
   compose falhará até criá-lo (multi-stage: install → prisma generate → nest build → runtime).
2. **Chaves JWT: base64 vs PEM** — o `.env.example` instrui a fazer base64 das PEMs,
   mas o código (`auth.module.ts`, `jwt.strategy.ts`, `main.ts`) consome **PEM cru**.
   Uma chave base64 falha em `crypto.createPrivateKey` e cai no par efêmero silenciosamente.
   Padronizar: aceitar base64 **ou** PEM, decodificando explicitamente.
3. **JWT efêmero em dev** — tokens invalidam a cada restart. Definir chaves fixas
   (via secret manager em staging/prod; nunca auto-gerar em produção).
4. **Pull do Docker Hub bloqueado** neste ambiente — para CI/deploy, usar um registry
   permitido pela política de egress ou espelho de imagens.

Esses itens já constam do roadmap (F2) em `ARCHITECTURE.md` e serão tratados na próxima fase.
