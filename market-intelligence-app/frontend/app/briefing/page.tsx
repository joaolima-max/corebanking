import { api } from "@/lib/api";

export default async function BriefingPage() {
  const briefing = await api.briefingToday();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Briefing do dia</h1>
      {briefing ? (
        <div className="rounded-lg bg-card p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/80">
            {briefing.content}
          </pre>
        </div>
      ) : (
        <p className="text-sm text-white/50">O briefing de hoje ainda não foi gerado.</p>
      )}
    </div>
  );
}
