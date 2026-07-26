'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, asArray } from '@/components/ui'
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
        <Stat label="Clientes (total)" value={clients.isLoading ? '…' : String(rows.length)} tone="muted" />
        <Stat label="Ativos" value={clients.isLoading ? '…' : String(active)} tone="pos" sub="operando" />
        <Stat label="White-labels" value={clients.isLoading ? '…' : String(wl)} />
        <Stat label="Gateway" value="99,98%" sub="● operacional" tone="pos" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <SectionTitle badge={<Chip tone="acc">escopo GLOBAL</Chip>}>
          Clientes
          <Link href="/dashboard/clientes" className="btn" style={{ marginLeft: 'auto', padding: '5px 10px', fontSize: 12 }}>Ver todos →</Link>
        </SectionTitle>
        <DataTable columns={cols} rows={rows.slice(0, 8)} loading={clients.isLoading} error={clients.error} emptyText="Nenhum cliente." />
      </Card>
    </motion.div>
  )
}
