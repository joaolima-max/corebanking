'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, Soon } from '@/components/ui'
const CORRIDORS = [
  { par: 'BRL → PYG', rate: '1.470,0', spread: '1,2%', vol: 'R$ 27,8M' },
  { par: 'BRL → USDC', rate: '0,1842', spread: '0,8%', vol: 'R$ 56,0M' },
  { par: 'USDC → MXN', rate: '18,74', spread: '0,9%', vol: 'US$ 8,2M' },
]
export default function Fx() {
  const cols: Column<typeof CORRIDORS[number]>[] = [
    { key: 'par', header: 'Corredor', render: (r) => <b>{r.par}</b> },
    { key: 'rate', header: 'Cotação', mono: true },
    { key: 'spread', header: 'Spread', mono: true },
    { key: 'vol', header: 'Volume 30d', align: 'right', mono: true },
  ]
  return (
    <div>
      <PageHeader title="FX & Liquidez" subtitle="Câmbio e liquidez multi-moeda · conversão instantânea e stablecoin" action={<Soon label="Nova cotação" note="Motor de cotação (quote engine) — será ligado ao FX/InstantPaymentPort nesta fase." />} />
      <StatGrid cols={4}>
        <Stat label="Liquidez total" value="R$ 148,9M" tone="muted" />
        <Stat label="Corredores" value="3 ativos" tone="pos" />
        <Stat label="Spread médio" value="0,97%" tone="muted" />
        <Stat label="Liquidação" value="1,8s" sub="instantânea" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}><SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Corredores FX</SectionTitle>
        <DataTable columns={cols} rows={CORRIDORS} /></Card>
      <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 16 }}>Cotação/settlement serão ligados ao backend nesta fase.</p>
    </div>
  )
}
