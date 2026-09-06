import { notFound } from "next/navigation";

import { api } from "@/lib/api";

export default async function BriefingHistoryPage({
  params,
}: {
  params: { date: string };
}) {
  const briefing = await api.briefingByDate(params.date);

  if (!briefing) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Briefing — {params.date}</h1>
      <div className="rounded-lg bg-card p-6">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">
          {briefing.content}
        </pre>
      </div>
    </div>
  );
}
