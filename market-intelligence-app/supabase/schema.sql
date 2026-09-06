-- Market Intelligence — Schema Supabase
-- Rodar no Supabase SQL Editor

-- Briefings diários gerados pelo Claude
create table briefings (
  id           uuid primary key default gen_random_uuid(),
  date         date not null unique,
  content      text not null,
  generated_at timestamptz default now(),
  model_used   text default 'claude-sonnet-4-6'
);

-- Notícias coletadas
create table news_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  summary      text,
  source       text not null,
  category     text not null check (category in ('market', 'fintech', 'regulatory', 'global', 'startup')),
  url          text,
  published_at timestamptz,
  collected_at timestamptz default now()
);

-- Snapshots de mercado
create table market_snapshots (
  id           uuid primary key default gen_random_uuid(),
  symbol       text not null,
  name         text not null,
  price        numeric not null,
  change_pct   numeric not null,
  volume       numeric,
  collected_at timestamptz default now()
);

-- Itens regulatórios (BCB e CVM)
create table regulatory_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text,
  source       text not null check (source in ('BCB', 'CVM')),
  published_at timestamptz,
  collected_at timestamptz default now()
);

-- Índices de apoio para as consultas mais comuns da API
create index idx_news_items_url on news_items (url);
create index idx_news_items_category on news_items (category);
create index idx_market_snapshots_symbol_collected on market_snapshots (symbol, collected_at desc);
create index idx_regulatory_items_source_title on regulatory_items (source, title);

-- Habilitar Realtime nas tabelas de dados em tempo real
alter publication supabase_realtime add table market_snapshots;
alter publication supabase_realtime add table news_items;
