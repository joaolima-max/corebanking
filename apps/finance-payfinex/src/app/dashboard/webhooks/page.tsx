'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Tabs, DataTable, Column, Soon } from '@/components/ui'
const EV = [
  { id: 'evt_71a', tipo: 'payment.received', tent: 3, st: 'Falha', tone: 'neg' as const },
  { id: 'evt_719', tipo: 'charge.paid', tent: 1, st: 'Entregue', tone: 'pos' as const },
  { id: 'evt_718', tipo: 'payout.completed', tent: 2, st: 'Pendente', tone: 'warn' as const },
]
export default function Webhooks() {
  const [tab, setTab] = useState('falhas')
  const cols: Column<typeof EV[number]>[] = [
    { key: 'id', header: 'Evento', mono: true, render: (r) => <span className="num" style={{ color: 'var(--text-3)' }}>{r.id}</span> },
    { key: 'tipo', header: 'Tipo', mono: true },
    { key: 'tent', header: 'Tentativas', mono: true, align: 'right' },
    { key: 'st', header: 'Status', render: (r) => <Chip tone={r.tone}>{r.st}</Chip> },
    { key: 'x', header: '', align: 'right', render: (r) => r.st !== 'Entregue' ? <Soon label="Reenviar" note="Reenvio do webhook (replay) — será ligado à fila de entrega nesta fase." /> : <span /> },
  ]
  return (
    <div>
      <PageHeader title="Webhooks" subtitle="Eventos enviados para o seu sistema · reenvio simples de falhas" action={<Soon label="Reenviar falhas" note="Reprocessa os eventos com falha — será ligado nesta fase." />} />
      <StatGrid cols={3}>
        <Stat label="Entregues (24h)" value="99,9%" tone="pos" /><Stat label="Falhas" value="3" tone="neg" /><Stat label="Endpoint" value="1 ativo" tone="muted" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} tabs={[{ key: 'falhas', label: 'Falhas & pendentes' }, { key: 'todas', label: 'Todas' }]} />
        <DataTable rows={tab === 'falhas' ? EV.filter((e) => e.st !== 'Entregue') : EV} columns={cols} emptyText="Sem eventos." />
      </Card>
    </div>
  )
}
