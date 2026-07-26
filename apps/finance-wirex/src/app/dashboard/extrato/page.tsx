'use client'

import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, asArray } from '@/components/ui'
import { useMe, useApi } from '@/lib/hooks'

interface Account { id: string; code: string; name: string; type: string; currency: string }
interface JournalEntry { id: string; description: string; status: string; postedAt: string }

export default function Extrato() {
  const me = useMe()
  const orgId = me.data?.orgId
  const accounts = useApi<unknown>(['ledger-accounts', orgId], orgId ? `/api/v1/ledger/accounts?orgId=${orgId}` : null)
  const entries = useApi<unknown>(['journal-all', orgId], orgId ? `/api/v1/ledger/journal-entries?orgId=${orgId}&limit=25` : null)

  const accRows = asArray<Account>(accounts.data)
  const entRows = asArray<JournalEntry>(entries.data)

  const accCols: Column<Account>[] = [
    { key: 'code', header: 'Código', mono: true, render: (r) => <span style={{ color: 'var(--text-2)' }}>{r.code}</span> },
    { key: 'name', header: 'Conta' },
    { key: 'type', header: 'Tipo', render: (r) => <Chip>{r.type}</Chip> },
    { key: 'currency', header: 'Moeda', mono: true, align: 'right' },
  ]
  const entCols: Column<JournalEntry>[] = [
    { key: 'id', header: 'ID', mono: true, render: (r) => <span style={{ color: 'var(--text-3)' }}>{r.id.slice(0, 12)}…</span> },
    { key: 'description', header: 'Descrição' },
    { key: 'postedAt', header: 'Data', render: (r) => (r.postedAt ? new Date(r.postedAt).toLocaleString('pt-BR') : '—') },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'POSTED' ? 'pos' : 'warn'}>{r.status}</Chip> },
  ]

  return (
    <div>
      <PageHeader title="Extrato" subtitle="Movimentações da sua conta · partidas dobradas no ledger" action={<button className="btn">Exportar CSV</button>} />
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle badge={<Chip tone="acc">ao vivo /ledger/journal-entries</Chip>}>Lançamentos</SectionTitle>
        <DataTable columns={entCols} rows={entRows} loading={entries.isLoading} error={entries.error} emptyText="Nenhum lançamento no período." />
      </Card>
      <Card>
        <SectionTitle badge={<Chip tone="acc">ao vivo /ledger/accounts</Chip>}>Plano de contas</SectionTitle>
        <DataTable columns={accCols} rows={accRows} loading={accounts.isLoading} error={accounts.error} />
      </Card>
    </div>
  )
}
