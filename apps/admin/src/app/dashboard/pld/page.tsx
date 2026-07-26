'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, Soon } from '@/components/ui'
const A = [
  { caso: 'Velocity anômala', cliente: 'Loja Aurora', risco: 'Alto', tone: 'neg' as const },
  { caso: 'Structuring suspeito', cliente: 'Cross Pay SA', risco: 'Médio', tone: 'warn' as const },
  { caso: 'PEP identificado', cliente: 'J. R. Nunes', risco: 'Baixo', tone: 'pos' as const },
]
export default function Pld() {
  const cols: Column<typeof A[number]>[] = [
    { key: 'caso', header: 'Caso', render: (r) => <b>{r.caso}</b> },
    { key: 'cliente', header: 'Cliente' },
    { key: 'risco', header: 'Risco', render: (r) => <Chip tone={r.tone}>{r.risco}</Chip> },
    { key: 'x', header: '', align: 'right', render: () => <Soon label="Investigar" note="Investigação PLD/FT + reporte (ex.: COAF) — será ligado ao CompliancePort nesta fase." /> },
  ]
  return (
    <div>
      <PageHeader title="PLD/FT" subtitle="Prevenção à lavagem de dinheiro e financiamento ao terrorismo · sanções e PEP" action={<Soon label="Reportar caso" note="Geração de reporte regulatório — será ligada nesta fase." />} />
      <StatGrid cols={4}>
        <Stat label="Alertas abertos" value="3" tone="warn" /><Stat label="Sanções (hits)" value="0" tone="pos" />
        <Stat label="PEP monitorados" value="12" tone="muted" /><Stat label="Reportes (30d)" value="0" tone="muted" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}><SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Casos PLD/FT</SectionTitle><DataTable columns={cols} rows={A} /></Card>
    </div>
  )
}
