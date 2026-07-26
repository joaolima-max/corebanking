'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, DataTable, Column, Chip, asArray } from '@/components/ui'
import { useMe, useApi } from '@/lib/hooks'

interface Entry { id: string; description: string; status: string; postedAt: string }

const MERCHANTS = ['Todos', 'Bolsão Paraguai', 'Exchanges Estrangeiras']

export default function Transacoes() {
  const me = useMe()
  const orgId = me.data?.orgId
  const entries = useApi<unknown>(['tx', orgId], orgId ? `/api/v1/ledger/journal-entries?orgId=${orgId}&limit=50` : null)
  const rows = asArray<Entry>(entries.data)
  const [merchant, setMerchant] = useState('Todos')

  const cols: Column<Entry>[] = [
    { key: 'id', header: 'Transação', mono: true, render: (r) => <span style={{ color: 'var(--text-2)' }}>{r.id.slice(0, 12)}…</span> },
    { key: 'description', header: 'Descrição' },
    { key: 'recebedor', header: 'Recebedor (merchant)', render: () => <Chip tone="acc">{merchant === 'Todos' ? 'Bolsão Paraguai' : merchant}</Chip> },
    { key: 'postedAt', header: 'Data', render: (r) => (r.postedAt ? new Date(r.postedAt).toLocaleString('pt-BR') : '—') },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'POSTED' ? 'pos' : 'warn'}>{r.status}</Chip> },
    { key: 'actions', header: '', align: 'right', render: (r) => <Link className="btn" href={`/dashboard/transacoes/${r.id}`} style={{ padding: '5px 10px', fontSize: 12 }}>Abrir →</Link> },
  ]

  return (
    <div>
      <PageHeader title="Transações" subtitle="Todas as transações da plataforma · recebedor, pagador e detalhes ponta a ponta" />
      <StatGrid cols={4}>
        <Stat label="Transações (janela)" value={entries.isLoading ? '…' : String(rows.length)} tone="muted" />
        <Stat label="Concluídas" value={String(rows.filter((r) => r.status === 'POSTED').length)} tone="pos" />
        <Stat label="Merchant" value={merchant} tone="muted" />
        <Stat label="Rail" value="PIX" sub="instantâneo" />
      </StatGrid>

      <Card style={{ marginTop: 14 }}>
        <SectionTitle badge={<Chip tone="acc">/ledger/journal-entries</Chip>}>
          Movimentações
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Filtrar por merchant:</span>
            <select value={merchant} onChange={(e) => setMerchant(e.target.value)} className="input" style={{ width: 'auto', padding: '6px 10px', fontSize: 12.5 }}>
              {MERCHANTS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </SectionTitle>
        <DataTable columns={cols} rows={rows} loading={entries.isLoading || me.isLoading} error={entries.error} emptyText="Nenhuma transação na janela." />
      </Card>
    </div>
  )
}
