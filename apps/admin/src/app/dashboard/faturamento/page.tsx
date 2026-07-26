'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, Soon } from '@/components/ui'
const ROWS = [
  { m: 'Bolsão Paraguai', tpv: 'R$ 64,2M', take: '0,79%', rev: 'R$ 507k', ciclo: 'Jul/2026' },
  { m: 'Exchanges Estrangeiras', tpv: 'R$ 48,9M', take: '0,85%', rev: 'R$ 415k', ciclo: 'Jul/2026' },
]
export default function Faturamento() {
  const cols: Column<typeof ROWS[number]>[] = [
    { key: 'm', header: 'Merchant', render: (r) => <b>{r.m}</b> },
    { key: 'tpv', header: 'TPV', mono: true },
    { key: 'take', header: 'Take rate', mono: true },
    { key: 'rev', header: 'Receita', align: 'right', mono: true },
    { key: 'ciclo', header: 'Ciclo' },
  ]
  return (
    <div>
      <PageHeader title="Faturamento & Tarifas" subtitle="Receita por merchant · take rate, tarifas e ciclos de cobrança" action={<Soon label="Fechar ciclo" note="Fechamento de fatura por merchant — será ligado ao módulo de billing nesta fase." />} />
      <StatGrid cols={3}>
        <Stat label="Receita (30d)" value="R$ 2,74M" tone="pos" />
        <Stat label="Take rate médio" value="0,88%" tone="muted" />
        <Stat label="Ciclos abertos" value="2" tone="muted" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}><SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Faturas por merchant</SectionTitle>
        <DataTable columns={cols} rows={ROWS} /></Card>
    </div>
  )
}
