'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, AreaChart, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'

interface Client { id: string; slug: string; name: string; type: string; status: string; settings?: { country?: string; currency?: string } }

const TYPE_LABEL: Record<string, string> = { BASS: 'Plataforma', WHITE_LABEL: 'White Label', COMPANY: 'Empresa', MERCHANT: 'Merchant' }

export default function VisaoGlobal() {
  const clients = useApi<unknown>(['admin-clients'], '/api/v1/admin/clients')
  const rows = asArray<Client>(clients.data)
  const active = rows.filter((c) => c.status === 'ACTIVE').length
  const wl = rows.filter((c) => c.type === 'WHITE_LABEL').length

  const cols: Column<Client>[] = [
    { key: 'name', header: 'Cliente', render: (r) => (<div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.slug}</div></div>) },
    { key: 'type', header: 'Tipo', render: (r) => TYPE_LABEL[r.type] ?? r.type },
    { key: 'country', header: 'País', render: (r) => r.settings?.country ?? '—' },
    { key: 'currency', header: 'Moeda', mono: true, render: (r) => r.settings?.currency ?? '—' },
    { key: 'status', header: 'Status', render: (r) => <Chip tone="pos">{r.status}</Chip> },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <PageHeader title="Visão global" subtitle={<>Gestão de todos os clientes · ao vivo de <span className="num">/api/v1/admin/clients</span></>} action={<button className="btn primary">＋ Provisionar cliente</button>} />
      <StatGrid cols={4}>
        <Stat label="Submerchants (total)" value={clients.isLoading ? '…' : String(rows.length)} tone="muted" />
        <Stat label="Ativos" value={clients.isLoading ? '…' : String(active)} tone="pos" sub="operando" />
        <Stat label="Merchants" value={clients.isLoading ? '…' : String(wl)} />
        <Stat label="Gateway" value="99,98%" sub="● operacional" tone="pos" />
      </StatGrid>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginTop: 14 }}>
        {[
          { t: 'SLA de operação', v: '99,98%', d: [99.9, 99.95, 100, 99.9, 100, 99.98, 99.99, 100, 99.97, 100, 99.98, 100], c: 'var(--pos)' },
          { t: 'API — req/min', v: '18,4k', d: [12, 14, 13, 16, 15, 18, 17, 20, 19, 22, 21, 24], c: 'var(--accent)' },
          { t: 'Webhooks entregues', v: '99,9%', d: [98, 99, 99.5, 99, 99.8, 99.9, 99.7, 100, 99.9, 100, 99.95, 100], c: 'var(--info)' },
          { t: 'Receita (30d)', v: 'R$ 2,74M', d: [1.8, 2.0, 1.9, 2.2, 2.3, 2.4, 2.5, 2.55, 2.6, 2.65, 2.7, 2.74], c: 'var(--accent-2)' },
        ].map((k) => (
          <Card key={k.t} pad={14}>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{k.t}</div>
            <div className="num" style={{ fontSize: 19, fontWeight: 650, margin: '6px 0 8px', letterSpacing: '-0.02em' }}>{k.v}</div>
            <AreaChart data={k.d} height={54} color={k.c} />
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: 14 }}>
        <SectionTitle badge={<Chip tone="acc">escopo GLOBAL</Chip>}>
          Submerchants
          <Link href="/dashboard/submerchants" className="btn" style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: 12 }}>Ver todos →</Link>
        </SectionTitle>
        <DataTable columns={cols} rows={rows.slice(0, 8)} loading={clients.isLoading} error={clients.error} emptyText="Nenhum cliente." />
      </Card>
    </motion.div>
  )
}
