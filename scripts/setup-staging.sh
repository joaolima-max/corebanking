#!/usr/bin/env bash
# ============================================================
# Bass Financial Core — Setup de Homologação
# Execute este script no seu terminal local
# ============================================================
set -euo pipefail

# ────────────────────────────────────────────────────────────
# CONFIGURAÇÃO — preencha antes de executar
# ────────────────────────────────────────────────────────────
SUPABASE_PASSWORD="SUA_SENHA_SUPABASE"   # ← substitua aqui

# Credenciais (já preenchidas)
SUPABASE_HOST="aws-1-us-east-2.pooler.supabase.com"
SUPABASE_USER="postgres.ovddcrsljhplhbenmzjk"

DATABASE_URL="postgresql://${SUPABASE_USER}:${SUPABASE_PASSWORD}@${SUPABASE_HOST}:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://${SUPABASE_USER}:${SUPABASE_PASSWORD}@${SUPABASE_HOST}:5432/postgres"
REDIS_URL=""              # ← cole sua Upstash Redis URL aqui (formato: rediss://...)
RAILWAY_TOKEN=""          # ← cole seu Railway token aqui
VERCEL_TOKEN=""           # ← cole seu Vercel token aqui

REPO_OWNER="joaolima-max"
REPO_NAME="corebanking"
BRANCH="claude/dreamy-turing-6yqoxs"

# ────────────────────────────────────────────────────────────
# Checar dependências
# ────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  Bass Financial Core — Deploy de Homologação     ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ "$SUPABASE_PASSWORD" = "SUA_SENHA_SUPABASE" ]; then
  echo "❌ Você esqueceu de preencher SUPABASE_PASSWORD no script!"
  exit 1
fi

command -v node >/dev/null 2>&1 || { echo "❌ Node.js não encontrado. Instale em nodejs.org"; exit 1; }
command -v git  >/dev/null 2>&1 || { echo "❌ Git não encontrado."; exit 1; }

# ────────────────────────────────────────────────────────────
# Instalar CLIs
# ────────────────────────────────────────────────────────────
echo "📦 Verificando Railway e Vercel CLI..."
if ! command -v railway >/dev/null 2>&1 || ! command -v vercel >/dev/null 2>&1; then
  sudo npm install -g @railway/cli vercel
fi
echo "✅ CLIs prontas"

# ────────────────────────────────────────────────────────────
# Gerar chaves RSA para JWT
# ────────────────────────────────────────────────────────────
echo ""
echo "🔑 Gerando chaves RSA 4096-bit..."
openssl genrsa -out /tmp/bass_private.pem 4096 2>/dev/null
openssl rsa -in /tmp/bass_private.pem -pubout -out /tmp/bass_public.pem 2>/dev/null
JWT_PRIVATE_KEY=$(base64 -w 0 /tmp/bass_private.pem 2>/dev/null || base64 /tmp/bass_private.pem | tr -d '\n')
JWT_PUBLIC_KEY=$(base64 -w 0 /tmp/bass_public.pem 2>/dev/null || base64 /tmp/bass_public.pem | tr -d '\n')
rm /tmp/bass_private.pem /tmp/bass_public.pem
echo "✅ Chaves geradas"

# ────────────────────────────────────────────────────────────
# Clonar o repositório (se não existir)
# ────────────────────────────────────────────────────────────
if [ ! -d "corebanking" ]; then
  echo ""
  echo "📥 Clonando repositório..."
  git clone "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
fi

cd corebanking
git checkout "$BRANCH"
git pull origin "$BRANCH"

# ────────────────────────────────────────────────────────────
# RAILWAY — Criar projeto e fazer deploy da API
# ────────────────────────────────────────────────────────────
echo ""
echo "🚂 Configurando Railway..."
export RAILWAY_TOKEN

# Inicializar projeto Railway
railway init --name "bass-financial-core" 2>/dev/null || true

# Fazer deploy
echo "🚀 Deploying API no Railway (pode levar 3-5 min)..."
railway up --service "bass-api" --detach

# Aguardar serviço iniciar
sleep 10

# Configurar variáveis de ambiente
echo "⚙️  Configurando variáveis de ambiente no Railway..."
railway variables set \
  NODE_ENV="production" \
  PORT="3000" \
  APP_NAME="Bass Financial Core" \
  DATABASE_URL="$DATABASE_URL" \
  DIRECT_URL="$DIRECT_URL" \
  REDIS_URL="$REDIS_URL" \
  JWT_PRIVATE_KEY="$JWT_PRIVATE_KEY" \
  JWT_PUBLIC_KEY="$JWT_PUBLIC_KEY" \
  JWT_EXPIRES_IN="15m" \
  JWT_REFRESH_EXPIRES_IN="7d" \
  THROTTLE_TTL="60000" \
  THROTTLE_LIMIT="100" \
  --service "bass-api"

# Obter URL da API
RAILWAY_API_URL=$(railway domain --service "bass-api" 2>/dev/null || echo "")
if [ -z "$RAILWAY_API_URL" ]; then
  RAILWAY_API_URL=$(railway status --service "bass-api" 2>/dev/null | grep "Deployment URL" | awk '{print $3}')
fi
echo "✅ API URL: https://${RAILWAY_API_URL}"

# Atualizar CORS com URL da API
railway variables set \
  ALLOWED_ORIGINS="https://${RAILWAY_API_URL}" \
  --service "bass-api"

# Executar migrations
echo ""
echo "🗄️  Executando migrations no Supabase..."
railway run --service "bass-api" -- npx prisma migrate deploy

# Executar seed
echo "🌱 Executando seed (dados iniciais)..."
railway run --service "bass-api" -- npx prisma db seed

echo "✅ Banco configurado com sucesso"

# ────────────────────────────────────────────────────────────
# VERCEL — Deploy do Frontend
# ────────────────────────────────────────────────────────────
echo ""
echo "▲ Configurando Vercel..."
export VERCEL_TOKEN

cd apps/web

# Link ou criar projeto
vercel link --yes --token="$VERCEL_TOKEN" 2>/dev/null || \
  vercel --token="$VERCEL_TOKEN" --yes --no-wait 2>/dev/null

# Configurar env vars no Vercel
echo "⚙️  Configurando variáveis de ambiente no Vercel..."
echo "https://${RAILWAY_API_URL}" | vercel env add NEXT_PUBLIC_API_URL production --token="$VERCEL_TOKEN" --yes 2>/dev/null || true
echo "STAGING" | vercel env add NEXT_PUBLIC_ENV production --token="$VERCEL_TOKEN" --yes 2>/dev/null || true

# Deploy
echo "🚀 Deploying frontend no Vercel..."
VERCEL_URL=$(vercel deploy --prod --token="$VERCEL_TOKEN" --yes 2>&1 | tail -1)

# Atualizar ALLOWED_ORIGINS com URL do Vercel
railway variables set \
  ALLOWED_ORIGINS="$VERCEL_URL" \
  --service "bass-api" 2>/dev/null || true

cd ../..

# ────────────────────────────────────────────────────────────
# Smoke test
# ────────────────────────────────────────────────────────────
echo ""
echo "🧪 Testando API..."
for i in {1..12}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://${RAILWAY_API_URL}/api/health" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo "✅ API respondendo OK"
    break
  fi
  echo "   Aguardando API iniciar... ($i/12)"
  sleep 10
done

# ────────────────────────────────────────────────────────────
# Resultado final
# ────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  🎉 DEPLOY CONCLUÍDO!                    ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  🌐 Frontend:  $VERCEL_URL"
echo "║  🔌 API:       https://$RAILWAY_API_URL"
echo "║  ❤️  Health:   https://$RAILWAY_API_URL/api/health"
echo "║                                                          ║"
echo "║  🔐 Login inicial:                                       ║"
echo "║     Email:  admin@basspago.com.br                        ║"
echo "║     Senha:  Admin@123!                                   ║"
echo "║                                                          ║"
echo "║  ⚠️  TROQUE A SENHA NO PRIMEIRO ACESSO!                  ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Guarde estas URLs — você precisará delas!"
