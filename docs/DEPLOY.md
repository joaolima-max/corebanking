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

## Variáveis de ambiente (resumo)

| Serviço | Variável | Obrigatória | Observação |
|---|---|---|---|
| API | `DATABASE_URL` / `DIRECT_URL` | sim | Postgres |
| API | `REDIS_URL` | sim | Redis |
| API | `ALLOWED_ORIGINS` | sim (prod) | URLs do Admin e Portal (CORS) |
| API | `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | não (MVP) | PEM RSA; se vazio, par efêmero |
| Admin/Portal | `NEXT_PUBLIC_API_URL` | sim | URL pública da API (lida no build) |

## Checklist pós-deploy
- [ ] `GET https://<api>/api/health` → `{"status":"ok"}`
- [ ] Swagger em `https://<api>/api/docs`
- [ ] Login no Admin e no Portal com o usuário do seed
- [ ] Admin: **Visão global** lista clientes · Portal: **Extrato** carrega o ledger
