'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, Soon } from '@/components/ui'
const MEDS = [
  { id: 'MED-4821', tipo: 'Fraude', valor: 'R$ 1.240,00', prazo: '7 dias', st: 'Aberta', tone: 'warn' as const },
  { id: 'MED-4810', tipo: 'Golpe', valor: 'R$ 540,00', prazo: '3 dias', st: 'Em defesa', tone: 'default' as const },
  { id: 'MED-4790', tipo: 'Fraude', valor: 'R$ 3.200,00', prazo: '—', st: 'Devolvida', tone: 'pos' as const },
]
export default function Infracoes() {
  const cols: Column<typeof MEDS[number]>[] = [
    { key: 'id', header: 'MED', mono: true, render: (r) => <b className="num">{r.id}</b> },
    { key: 'tipo', header: 'Tipo', render: (r) => <Chip>{r.tipo}</Chip> },
    { key: 'valor', header: 'Valor', mono: true },
    { key: 'prazo', header: 'Prazo' },
    { key: 'st', header: 'Status', render: (r) => <Chip tone={r.tone}>{r.st}</Chip> },
    { key: 'x', header: '', align: 'right', render: () => <Soon label="Tratar MED" note="Gestão de MED (Mecanismo Especial de Devolução do PIX) — será ligada ao rail/Infrações nesta fase." /> },
  ]
  return (
    <div>
      <PageHeader title="Infrações (MEDs)" subtitle="Gestão de MEDs — Mecanismo Especial de Devolução do PIX · defesas e devoluções" />
      <StatGrid cols={4}>
        <Stat label="MEDs abertas" value="2" tone="warn" /><Stat label="Em defesa" value="1" tone="muted" />
        <Stat label="Devolvidas (30d)" value="4" tone="pos" /><Stat label="Valor em disputa" value="R$ 1,8k" tone="neg" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}><SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Casos de infração</SectionTitle><DataTable columns={cols} rows={MEDS} /></Card>
    </div>
  )
}
