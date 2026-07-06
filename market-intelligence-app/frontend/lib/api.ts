import type { Briefing, MarketSnapshot, NewsItem, RegulatoryItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (error) {
    console.error(`Erro ao buscar ${path}`, error);
    return null;
  }
}

export const api = {
  briefingToday: () => apiFetch<Briefing>("/api/briefings/today", 300),
  briefingByDate: (date: string) => apiFetch<Briefing>(`/api/briefings/${date}`, 3600),
  marketSnapshot: () => apiFetch<MarketSnapshot[]>("/api/market/snapshot", 60),
  news: (category?: string) =>
    apiFetch<NewsItem[]>(`/api/news${category ? `?category=${category}` : ""}`, 120),
  regulatoryLatest: () => apiFetch<RegulatoryItem[]>("/api/regulatory/latest", 3600),
};
