'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Tabs, DataTable, Column, Soon, AreaChart } from '@/components/ui'
const EV = [
  { id: 'evt_9a1', tipo: 'payment.received', dest: 'Bolsão Paraguai', tent: 4, st: 'Falha', tone: 'neg' as const },
  { id: 'evt_9a0', tipo: 'transfer.completed', dest: 'Exchanges', tent: 1, st: 'Entregue', tone: 'pos' as const },
  { id: 'evt_99f', tipo: 'payment.received', dest: 'Norte Digital', tent: 2, st: 'Pendente', tone: 'warn' as const },
]
export default function Webhooks() {
  const [tab, setTab] = useState('falhas')
  const cols: Column<typeof EV[number]>[] = [
    { key: 'id', header: 'Evento', mono: true, render: (r) => <span className="num" style={{ color: 'var(--text-3)' }}>{r.id}</span> },
    { key: 'tipo', header: 'Tipo', mono: true },
    { key: 'dest', header: 'Destino' },
    { key: 'tent', header: 'Tentativas', mono: true, align: 'right' },
    { key: 'st', header: 'Status', render: (r) => <Chip tone={r.tone}>{r.st}</Chip> },
    { key: 'x', header: '', align: 'right', render: () => <Soon label="Reenviar" note="Reenvio do webhook (replay) — será ligado à fila de entrega nesta fase." /> },
  ]
  return (
    <div>
      <PageHeader title="Webhooks" subtitle="Entregas de eventos, falhas e reenvio · monitoramento de entrega" action={<Soon label="Reenviar todos falhos" note="Reprocessa a dead-letter — será ligado nesta fase." />} />
      <StatGrid cols={4}>
        <Stat label="Taxa de entrega (24h)" value="99,98%" tone="pos" />
        <Stat label="Falhas (24h)" value="12" tone="neg" />
        <Stat label="Pendentes" value="3" tone="warn" />
        <Stat label="Latência média" value="240ms" tone="muted" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <SectionTitle>Entregas por hora (24h)</SectionTitle>
        <AreaChart data={[120, 132, 128, 140, 150, 138, 160, 172, 168, 180, 176, 190, 210, 198, 220, 215, 230, 240, 228, 250, 245, 260, 255, 270]} color="var(--accent)" />
      </Card>
      <Card style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} tabs={[{ key: 'falhas', label: 'Falhas & pendentes' }, { key: 'todas', label: 'Todas as entregas' }]} />
        <DataTable rows={tab === 'falhas' ? EV.filter((e) => e.st !== 'Entregue') : EV} columns={cols} emptyText="Sem eventos." />
      </Card>
    </div>
  )
}
