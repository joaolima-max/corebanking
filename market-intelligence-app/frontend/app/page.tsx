import { BriefingCard } from "@/components/BriefingCard";
import { MarketTicker } from "@/components/MarketTicker";
import { NewsFeed } from "@/components/NewsFeed";
import { RegulatoryAlert } from "@/components/RegulatoryAlert";
import { api } from "@/lib/api";

export default async function DashboardPage() {
  const [briefing, market, news, regulatory] = await Promise.all([
    api.briefingToday(),
    api.marketSnapshot(),
    api.news(),
    api.regulatoryLatest(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <MarketTicker initialData={market ?? []} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BriefingCard briefing={briefing} />
        <RegulatoryAlert items={(regulatory ?? []).slice(0, 3)} />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Últimas notícias</h2>
        <NewsFeed initialData={(news ?? []).slice(0, 8)} />
      </div>
    </div>
  );
}
