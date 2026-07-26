'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, Soon } from '@/components/ui'
const AL = [
  { t: 'Pico de cash out', sev: 'Alto', cliente: 'Andes Fintech', tone: 'neg' as const },
  { t: 'Novo dispositivo', sev: 'Médio', cliente: 'Tienda Sol', tone: 'warn' as const },
  { t: 'Volume acima da média', sev: 'Baixo', cliente: 'Norte Digital', tone: 'default' as const },
]
export default function Risco() {
  const cols: Column<typeof AL[number]>[] = [
    { key: 't', header: 'Alerta', render: (r) => <b>{r.t}</b> },
    { key: 'cliente', header: 'Cliente' },
    { key: 'sev', header: 'Severidade', render: (r) => <Chip tone={r.tone}>{r.sev}</Chip> },
    { key: 'x', header: '', align: 'right', render: () => <Soon label="Tratar" note="Tratamento de alerta transacional — será ligado ao motor de risco nesta fase." /> },
  ]
  return (
    <div>
      <PageHeader title="Monitoramento de risco" subtitle="Alertas transacionais em tempo real · velocity, device, geolocalização" />
      <StatGrid cols={4}>
        <Stat label="Alertas (24h)" value="3" tone="warn" /><Stat label="Bloqueios automáticos" value="1" tone="neg" />
        <Stat label="Falsos positivos" value="0,4%" tone="muted" /><Stat label="Score médio" value="18/100" tone="pos" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}><SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Alertas recentes</SectionTitle><DataTable columns={cols} rows={AL} /></Card>
    </div>
  )
}
