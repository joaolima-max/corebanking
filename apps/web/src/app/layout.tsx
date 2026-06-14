import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bass Financial Core',
  description: 'Bass Pago — Core Banking Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
