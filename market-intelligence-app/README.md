# Market Intelligence

Aplicação web de inteligência de mercado: coleta dados de bolsas, cripto, notícias
financeiras e comunicados regulatórios (BCB/CVM), gera um briefing executivo diário
com Claude e exibe tudo em um dashboard com atualização em tempo real.

Stack: Next.js 14 + FastAPI + Supabase (PostgreSQL + Realtime) + Claude API.

## Estrutura

```
market-intelligence-app/
├── frontend/     # Next.js 14 (App Router) + Tailwind + Supabase JS
├── backend/      # FastAPI + APScheduler + collectors + geração de briefing
├── supabase/     # schema.sql para rodar no SQL Editor do Supabase
└── docker-compose.yml
```

## Configuração

1. Crie um projeto em [supabase.com](https://supabase.com) e rode `supabase/schema.sql`
   no SQL Editor.
2. Copie `.env.example` para `.env` na raiz e preencha as chaves (Anthropic, NewsAPI,
   CoinGecko, Supabase, Gmail).
3. Copie as mesmas variáveis `NEXT_PUBLIC_*` e `SUPABASE_*` também para
   `frontend/.env.local` (o Next.js não lê o `.env` da raiz).

## Rodando localmente

**Backend:**

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env .env   # ou exporte as variáveis de outra forma
uvicorn main:app --reload
```

A API sobe em `http://localhost:8000`. `GET /api/health` confirma que está no ar.
Ao subir, o scheduler interno já agenda os jobs de coleta e a geração diária do
briefing — não é necessário rodar nada manualmente em produção.

Para testar um collector isoladamente:

```bash
python -c "from collectors.market import collect_market; collect_market()"
```

Para gerar um briefing manualmente:

```bash
curl -X POST http://localhost:8000/api/briefings/generate
```

Alternativa via Docker: `docker compose up --build` (a partir da raiz deste diretório).

**Frontend:**

```bash
cd frontend
pnpm install   # ou npm install
pnpm dev
```

Acesse `http://localhost:3000`.

## Deploy

| Componente | Serviço |
|---|---|
| Frontend | Vercel (root directory: `market-intelligence-app/frontend`) |
| Backend | Railway ou Render (root directory: `market-intelligence-app/backend`, usa o `Procfile`) |
| Banco de dados | Supabase |

## Restrições seguidas

- Cada collector (`collectors/market.py`, `crypto.py`, `news.py`, `regulatory.py`) tem
  seu próprio try/except e loga erros sem interromper o scheduler nem os demais
  collectors.
- Nenhuma chave de API é logada ou exibida.
- Textos da interface em português.
