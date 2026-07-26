# DEPLOY — colocar o MVP no ar

O monorepo tem 3 serviços: **API** (`apps/api`), **Admin** (`apps/admin`, :3002) e **Portal**
(`apps/portal`, :3001), mais **PostgreSQL** e **Redis**.

> ⚠️ O deploy roda **a partir da sua conta/servidor** — o ambiente de desenvolvimento não tem
> acesso de rede a provedores externos. Abaixo, dois caminhos prontos.

Credenciais do seed (após rodar o seed): `admin@basspago.com.br` / `Admin@123!`.

---

## Caminho A — Vercel (frontends) + Railway (API) · recomendado, sem Docker

### 1) API + banco no Railway
1. Railway → **New Project → Deploy from GitHub repo** → selecione `joaolima-max/corebanking`.
   O build usa `nixpacks.toml` / `Procfile` / `railway.json` que já existem.
2. No projeto, **+ New → Database → PostgreSQL** e **+ New → Database → Redis**.
3. No serviço da API, aba **Variables**:
   - `DATABASE_URL` = a connection string do Postgres do Railway (com `?schema=public`)
   - `DIRECT_URL` = a mesma sem query string (ou igual a `DATABASE_URL`)
   - `REDIS_URL` = a URL do Redis do Railway
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = as URLs do Admin e Portal na Vercel (preencha após o passo 2), separadas por vírgula
   - `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` = **opcional no MVP** (se vazias, o servidor gera um par efêmero; tokens caem a cada restart). Para estável: `openssl genrsa -out private.pem 2048 && openssl rsa -in private.pem -pubout -out public.pem` e cole as PEMs.
4. Migrations + seed (uma vez), via Railway CLI ou um shell do serviço:
   ```bash
   pnpm --filter api exec prisma migrate deploy
   pnpm --filter api exec prisma db seed
   ```
5. Anote a **URL pública da API** (ex.: `https://corebanking-api.up.railway.app`).

### 2) Admin e Portal na Vercel (2 projetos)
Para **cada** app (`apps/admin` e depois `apps/portal`):
1. Vercel → **Add New → Project** → importe o mesmo repo.
2. **Root Directory** = `apps/admin` (e no segundo projeto, `apps/portal`). Framework: **Next.js** (auto).
   O `vercel.json` de cada app já define install/build para o monorepo pnpm.
3. **Environment Variables** → `NEXT_PUBLIC_API_URL` = a URL pública da API (passo 1.5).
4. Deploy. Você recebe as URLs (ex.: `https://bass-admin.vercel.app`, `https://bass-portal.vercel.app`).
5. Volte ao Railway e coloque essas duas URLs em `ALLOWED_ORIGINS` (CORS) → redeploy da API.

Pronto: acesse as duas URLs da Vercel e faça login.

> `NEXT_PUBLIC_API_URL` é lido **no build**. Se mudar a URL da API, faça **redeploy** dos frontends.

---

## Caminho B — Docker Compose no seu servidor (VPS) · tudo em um comando

Requer um host onde o Docker Hub seja acessível.

```bash
git clone https://github.com/joaolima-max/corebanking && cd corebanking
git checkout claude/global-financial-platform-kz6gnp
cp .env.deploy.example .env      # preencha senha, URLs e (opcional) JWT
docker compose -f docker-compose.deploy.yml up -d --build
docker compose -f docker-compose.deploy.yml exec api pnpm exec prisma db seed
```

Serviços expostos: API `:3000`, Portal `:3001`, Admin `:3002`.
Coloque um reverse proxy (Nginx/Traefik + Let's Encrypt) na frente para HTTPS e domínios
(`api.`, `admin.`, `app.`). Ajuste `ALLOWED_ORIGINS` e `NEXT_PUBLIC_API_URL` no `.env` para os domínios finais e rode `up -d --build` de novo.

---

## Onde rodar a API (alternativas ao Railway)

A API só precisa de um lugar que rode Node. Opções gratuitas/baratas:

| Host | Grátis | Observação |
|---|---|---|
| **Render** (recomendado) | sim | Igual ao Railway (conecta no GitHub). No plano free a API "dorme" após ~15 min sem uso (1ª chamada demora ~30s). |
| **Koyeb** | sim | 1 instância free que não dorme. |
| **Fly.io** | allowance free | Usa Docker (temos `apps/api/Dockerfile`); um pouco mais técnico. |

### Passo a passo no Render (usando nosso Dockerfile)
1. https://render.com → login com GitHub → **New → Web Service** → escolha `joaolima-max/corebanking`.
2. **Branch:** `claude/global-financial-platform-kz6gnp`.
3. **Runtime/Language:** Docker. **Dockerfile Path:** `apps/api/Dockerfile` · **Docker Build Context:** `.` (raiz).
4. **Environment → Add Environment Variable:** `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`, `NODE_ENV=production`, `ALLOWED_ORIGINS` (URLs da Vercel). JWT é opcional no MVP.
5. **Health Check Path:** `/api/health`. Crie o serviço.
   (O container já roda `prisma migrate deploy` no boot; o **seed** roda uma vez pelo **Shell** do Render: `cd apps/api && pnpm exec prisma db seed`.)
6. Copie a **URL pública** que o Render gera e use como `NEXT_PUBLIC_API_URL` na Vercel.

## Banco no Supabase (opcional, recomendado)

O projeto já é compatível com Supabase (o Prisma usa `DATABASE_URL` para queries e
`DIRECT_URL` para migrations). Supabase substitui **apenas o PostgreSQL** — a API continua
rodando no Railway/Render, e o **Redis** vem de outro lugar (ex.: Upstash, grátis).

No painel do Supabase → **Project Settings → Database → Connection string**:
- `DATABASE_URL` = string do **Connection pooler** (porta **6543**, modo *Transaction*), acrescente `?pgbouncer=true&connection_limit=1`
- `DIRECT_URL` = string da **Direct connection** (porta **5432**)

Depois rode as migrations normalmente (`prisma migrate deploy` usa a `DIRECT_URL`) e o seed.
Extensões `uuid-ossp`/`pgcrypto` já vêm disponíveis no Supabase.

**Redis:** crie um banco grátis no **Upstash** (upstash.com) e use a URL dele em `REDIS_URL`.

Resumo dos provedores nesse cenário: **Supabase** (Postgres) + **Upstash** (Redis) +
**Railway/Render** (API) + **Vercel** (frontends).

## Variáveis de ambiente (resumo)

| Serviço | Variável | Obrigatória | Observação |
|---|---|---|---|
| API | `DATABASE_URL` / `DIRECT_URL` | sim | Postgres |
| API | `REDIS_URL` | sim | Redis |
| API | `ALLOWED_ORIGINS` | sim (prod) | URLs do Admin e Portal (CORS) |
| API | `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | não (MVP) | PEM RSA; se vazio, par efêmero |
| Admin/Portal | `NEXT_PUBLIC_API_URL` | sim | URL pública da API (lida no build) |

## Deploy automático no Vercel (GitHub Actions)

Já existe o workflow `.github/workflows/deploy-vercel.yml` que publica os 3 frontends
(Core `apps/admin`, Finance Wirex, Finance Payfinex) a cada push. Para ativar, adicione em
**GitHub → repo → Settings → Secrets and variables → Actions**:

| Secret | Onde obter |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Settings → General (ou `.vercel/project.json` após `vercel link`) |
| `VERCEL_PROJECT_ID_CORE` | ID do projeto Vercel do `apps/admin` |
| `VERCEL_PROJECT_ID_WIREX` | ID do projeto Vercel do `apps/finance-wirex` |
| `VERCEL_PROJECT_ID_PAYFINEX` | ID do projeto Vercel do `apps/finance-payfinex` |

Crie os 3 projetos no Vercel uma vez (pode ser importando o repo e escolhendo o Root Directory
de cada app, ou `vercel link` dentro de cada pasta). Em cada projeto defina a env
`NEXT_PUBLIC_API_URL` = URL pública da API. Sem os secrets, o workflow apenas avisa e pula.

> Alternativa sem CI: a **integração Git nativa do Vercel** também faz deploy automático a cada
> push — basta importar o repo e criar 1 projeto por app (Root Directory). Não precisa de secrets.

## Checklist pós-deploy
- [ ] `GET https://<api>/api/health` → `{"status":"ok"}`
- [ ] Swagger em `https://<api>/api/docs`
- [ ] Login no Admin e no Portal com o usuário do seed
- [ ] Admin: **Visão global** lista clientes · Portal: **Extrato** carrega o ledger
