'use client'

import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, asArray } from '@/components/ui'
import { useMe, useApi } from '@/lib/hooks'

interface User { id: string; email: string; fullName: string; status: string; createdAt?: string }

export default function Usuarios() {
  const me = useMe()
  const orgId = me.data?.orgId
  const users = useApi<unknown>(['users', orgId], orgId ? `/api/v1/users?orgId=${orgId}` : null)
  const rows = asArray<User>(users.data)
  const cols: Column<User>[] = [
    { key: 'fullName', header: 'Usuário', render: (r) => <b>{r.fullName}</b> },
    { key: 'email', header: 'E-mail', mono: true },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'ACTIVE' ? 'pos' : 'warn'}>{r.status}</Chip> },
    { key: 'createdAt', header: 'Criado', align: 'right', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString('pt-BR') : '—') },
  ]
  return (
    <div>
      <PageHeader title="Usuários" subtitle="Equipe interna e usuários das organizações" action={<button className="btn primary">Convidar usuário</button>} />
      <Card>
        <SectionTitle badge={<Chip tone="acc">/users</Chip>}>{rows.length} usuários</SectionTitle>
        <DataTable columns={cols} rows={rows} loading={users.isLoading || me.isLoading} error={users.error} emptyText="Nenhum usuário." />
      </Card>
    </div>
  )
}
