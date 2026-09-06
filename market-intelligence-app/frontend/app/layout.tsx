import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Sidebar } from "@/components/Sidebar";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Market Intelligence",
  description: "Inteligência de mercado em tempo real",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-background font-sans text-white">
        <Sidebar />
        <main className="ml-56 min-h-screen p-8">{children}</main>
      </body>
    </html>
  );
}
