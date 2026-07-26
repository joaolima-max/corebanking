'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, asArray } from '@/components/ui'
import { useMe, useApi } from '@/lib/hooks'

interface JournalEntry { id: string; description: string; status: string; postedAt: string }

export default function Inicio() {
  const me = useMe()
  const orgId = me.data?.orgId
  const accounts = useApi<unknown>(['ledger-accounts', orgId], orgId ? `/api/v1/ledger/accounts?orgId=${orgId}` : null)
  const entries = useApi<unknown>(['journal', orgId], orgId ? `/api/v1/ledger/journal-entries?orgId=${orgId}&limit=6` : null)

  const accountsList = asArray(accounts.data)
  const entriesList = asArray<JournalEntry>(entries.data)

  const cols: Column<JournalEntry>[] = [
    { key: 'id', header: 'ID', mono: true, render: (r) => <span style={{ color: 'var(--text-3)' }}>{r.id.slice(0, 10)}…</span> },
    { key: 'description', header: 'Descrição' },
    { key: 'postedAt', header: 'Data', render: (r) => (r.postedAt ? new Date(r.postedAt).toLocaleString('pt-BR') : '—') },
    { key: 'status', header: 'Status', render: (r) => <Chip tone="pos">{r.status}</Chip> },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <PageHeader
        title="Início"
        subtitle="Pagamentos instantâneos · liquidação em tempo real · dados ao vivo"
        action={<Link className="btn primary" href="/dashboard/pix">＋ Nova cobrança PIX</Link>}
      />

      <StatGrid cols={4}>
        <Stat label="Saldo disponível" value="R$ 284.502,90" sub={<span className="instant">⚡ instantâneo</span>} />
        <Stat label="Recebido hoje" value="R$ 41,23k" sub="+ 9% vs. ontem" tone="pos" />
        <Stat label="Contas contábeis" value={accounts.isLoading ? '…' : String(accountsList.length)} sub="do seu tenant" tone="muted" />
        <Stat label="Lançamentos (últimos)" value={entries.isLoading ? '…' : String(entriesList.length)} sub="ledger ao vivo" tone="muted" />
      </StatGrid>

      <Card style={{ marginTop: 14 }}>
        <SectionTitle badge={<Chip tone="acc">ao vivo /ledger/journal-entries</Chip>}>Últimos lançamentos</SectionTitle>
        <DataTable columns={cols} rows={entriesList} loading={entries.isLoading} error={entries.error} emptyText="Nenhum lançamento ainda." />
      </Card>
    </motion.div>
  )
}
