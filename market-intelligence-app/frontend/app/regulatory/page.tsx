import { RegulatoryAlert } from "@/components/RegulatoryAlert";
import { api } from "@/lib/api";

export default async function RegulatoryPage() {
  const items = await api.regulatoryLatest();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Regulatório</h1>
      <RegulatoryAlert items={items ?? []} />
    </div>
  );
}
