export interface Briefing {
  id: string;
  date: string;
  content: string;
  generated_at: string;
  model_used: string | null;
}

export type NewsCategory = "market" | "fintech" | "regulatory" | "global" | "startup";

export interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  source: string;
  category: NewsCategory;
  url: string | null;
  published_at: string | null;
  collected_at: string;
}

export interface MarketSnapshot {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change_pct: number;
  volume: number | null;
  collected_at: string;
}

export interface RegulatoryItem {
  id: string;
  title: string;
  body: string | null;
  source: "BCB" | "CVM";
  published_at: string | null;
  collected_at: string;
}
