import type { RegulatoryItem } from "@/types";

export function RegulatoryAlert({ items }: { items: RegulatoryItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-card p-4 text-sm text-white/50">
        Sem novidades regulatórias relevantes hoje.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg bg-card p-4">
          <div className="mb-1 flex items-center gap-2 text-xs text-white/40">
            <span className="rounded bg-white/10 px-2 py-0.5">{item.source}</span>
          </div>
          <h3 className="text-sm font-medium text-white">{item.title}</h3>
          {item.body && <p className="mt-1 text-sm text-white/50">{item.body}</p>}
        </div>
      ))}
    </div>
  );
}
