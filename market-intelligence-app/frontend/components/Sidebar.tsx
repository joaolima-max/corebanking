"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/briefing", label: "Briefing" },
  { href: "/markets", label: "Mercados" },
  { href: "/news", label: "Notícias" },
  { href: "/regulatory", label: "Regulatório" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r border-white/10 bg-card p-6">
      <h1 className="mb-8 text-lg font-semibold text-white">Market Intelligence</h1>
      <nav className="flex flex-col gap-2">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
