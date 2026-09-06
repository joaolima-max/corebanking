"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { NewsItem } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  market: "Mercado",
  fintech: "Fintech",
  regulatory: "Regulatório",
  global: "Global",
  startup: "Startups",
};

export function NewsFeed({
  initialData,
  category,
}: {
  initialData: NewsItem[];
  category?: string;
}) {
  const [items, setItems] = useState<NewsItem[]>(initialData);

  useEffect(() => {
    const channel = supabase
      .channel("news_items_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "news_items" },
        (payload) => {
          const item = payload.new as NewsItem;
          if (category && item.category !== category) return;
          setItems((prev) => [item, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category]);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-card p-4 transition-colors hover:bg-white/5"
        >
          <div className="mb-1 flex items-center gap-2 text-xs text-white/40">
            <span className="rounded bg-white/10 px-2 py-0.5">
              {CATEGORY_LABELS[item.category] ?? item.category}
            </span>
            <span>{item.source}</span>
          </div>
          <h3 className="text-sm font-medium text-white">{item.title}</h3>
          {item.summary && <p className="mt-1 text-sm text-white/50">{item.summary}</p>}
        </a>
      ))}
      {items.length === 0 && (
        <span className="text-sm text-white/50">Nenhuma notícia coletada ainda.</span>
      )}
    </div>
  );
}
