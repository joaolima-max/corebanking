import Link from "next/link";

import type { Briefing } from "@/types";

export function BriefingCard({ briefing }: { briefing: Briefing | null }) {
  if (!briefing) {
    return (
      <div className="rounded-lg bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold text-white">Briefing do dia</h2>
        <p className="text-sm text-white/50">O briefing de hoje ainda não foi gerado.</p>
      </div>
    );
  }

  const preview = briefing.content.split("\n").slice(0, 6).join("\n");

  return (
    <div className="rounded-lg bg-card p-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Briefing do dia</h2>
        <Link href="/briefing" className="text-sm text-white/60 hover:text-white">
          Ver completo →
        </Link>
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm text-white/70">{preview}</pre>
    </div>
  );
}
