'use client'

import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'

interface Org { id: string; slug: string; name: string; type: string; status: string; parentId?: string | null }

export default function Organizacoes() {
  const orgs = useApi<unknown>(['organizations'], '/api/v1/organizations')
  const rows = asArray<Org>(orgs.data)
  const cols: Column<Org>[] = [
    { key: 'name', header: 'Organização', render: (r) => <b>{r.name}</b> },
    { key: 'slug', header: 'Slug', mono: true },
    { key: 'type', header: 'Tipo', render: (r) => <Chip>{r.type}</Chip> },
    { key: 'parentId', header: 'Matriz', render: (r) => (r.parentId ? <span className="num" style={{ color: 'var(--text-3)' }}>{r.parentId.slice(0, 8)}…</span> : '—') },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'ACTIVE' ? 'pos' : 'warn'}>{r.status}</Chip> },
  ]
  return (
    <div>
      <PageHeader title="Organizações" subtitle="Estrutura multi-tenant · matriz e sub-organizações" action={<button className="btn primary">Nova organização</button>} />
      <Card>
        <SectionTitle badge={<Chip tone="acc">/organizations</Chip>}>Hierarquia</SectionTitle>
        <DataTable columns={cols} rows={rows} loading={orgs.isLoading} error={orgs.error} />
      </Card>
    </div>
  )
}
