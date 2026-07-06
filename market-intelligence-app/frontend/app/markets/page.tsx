import { MarketTicker } from "@/components/MarketTicker";
import { api } from "@/lib/api";

export default async function MarketsPage() {
  const market = await api.marketSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Mercados</h1>
      <MarketTicker initialData={market ?? []} />
    </div>
  );
}
