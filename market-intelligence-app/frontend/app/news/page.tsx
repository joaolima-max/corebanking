import { NewsFeed } from "@/components/NewsFeed";
import { api } from "@/lib/api";

const CATEGORIES: { value?: string; label: string }[] = [
  { value: undefined, label: "Todas" },
  { value: "market", label: "Mercado" },
  { value: "fintech", label: "Fintech" },
  { value: "regulatory", label: "Regulatório" },
  { value: "global", label: "Global" },
  { value: "startup", label: "Startups" },
];

export default async function NewsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;
  const news = await api.news(category);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Notícias</h1>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((item) => (
          <a
            key={item.label}
            href={item.value ? `/news?category=${item.value}` : "/news"}
            className={`rounded-full px-3 py-1 text-sm ${
              category === item.value
                ? "bg-white text-black"
                : "bg-card text-white/60 hover:text-white"
            }`}
          >
            {item.label}
          </a>
        ))}
      </div>
      <NewsFeed initialData={news ?? []} category={category} />
    </div>
  );
}
