'use client'

import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, Soon, asArray } from '@/components/ui'
import { useMe, useApi } from '@/lib/hooks'

interface Account { id: string; name: string; type: string; currency: string; status: string; balance?: string }

export default function Contas() {
  const me = useMe()
  const orgId = me.data?.orgId
  const accounts = useApi<unknown>(['accounts', orgId], orgId ? `/api/v1/accounts?orgId=${orgId}` : null)
  const rows = asArray<Account>(accounts.data)

  const cols: Column<Account>[] = [
    { key: 'name', header: 'Conta', render: (r) => <b>{r.name}</b> },
    { key: 'type', header: 'Tipo', render: (r) => <Chip>{r.type}</Chip> },
    { key: 'currency', header: 'Moeda', mono: true },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'ACTIVE' ? 'pos' : 'warn'}>{r.status}</Chip> },
  ]

  return (
    <div>
      <PageHeader title="Saldos & Wallets" subtitle="Wallets e contas do seu tenant · saldo derivado do ledger" action={<Soon label="Nova conta" note="Abertura de nova conta/wallet — será ligada a /accounts nesta fase." />} />
      <Card>
        <SectionTitle badge={<Chip tone="acc">ao vivo /accounts</Chip>}>Contas</SectionTitle>
        <DataTable columns={cols} rows={rows} loading={accounts.isLoading} error={accounts.error} emptyText="Nenhuma conta cadastrada ainda." />
      </Card>
    </div>
  )
}
