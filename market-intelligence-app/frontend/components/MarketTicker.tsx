"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { MarketSnapshot } from "@/types";

function latestBySymbol(rows: MarketSnapshot[]): MarketSnapshot[] {
  const map = new Map<string, MarketSnapshot>();
  for (const row of rows) {
    const current = map.get(row.symbol);
    if (!current || new Date(row.collected_at) > new Date(current.collected_at)) {
      map.set(row.symbol, row);
    }
  }
  return Array.from(map.values());
}

export function MarketTicker({ initialData }: { initialData: MarketSnapshot[] }) {
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>(latestBySymbol(initialData));

  useEffect(() => {
    const channel = supabase
      .channel("market_snapshots_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "market_snapshots" },
        (payload) => {
          setSnapshots((prev) => latestBySymbol([...prev, payload.new as MarketSnapshot]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex flex-wrap gap-4 overflow-x-auto rounded-lg bg-card p-4">
      {snapshots.map((item) => (
        <div key={item.symbol} className="flex min-w-[140px] flex-col">
          <span className="text-xs text-white/50">{item.name}</span>
          <span className="text-lg font-semibold text-white">
            {item.price.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
          </span>
          <span className={item.change_pct >= 0 ? "text-sm text-up" : "text-sm text-down"}>
            {item.change_pct >= 0 ? "▲" : "▼"} {Math.abs(item.change_pct).toFixed(2)}%
          </span>
        </div>
      ))}
      {snapshots.length === 0 && (
        <span className="text-sm text-white/50">Nenhum dado de mercado ainda.</span>
      )}
    </div>
  );
}
