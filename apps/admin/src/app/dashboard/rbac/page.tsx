'use client'

import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'

interface Role { id: string; slug: string; name: string; scope: string; description?: string }
interface Permission { id: string; resource: string; action: string; scopeType: string }

export default function Rbac() {
  const roles = useApi<unknown>(['roles'], '/api/v1/roles')
  const perms = useApi<unknown>(['permissions'], '/api/v1/permissions')
  const roleRows = asArray<Role>(roles.data)
  const permRows = asArray<Permission>(perms.data)

  const roleCols: Column<Role>[] = [
    { key: 'name', header: 'Papel', render: (r) => <b>{r.name}</b> },
    { key: 'slug', header: 'Slug', mono: true },
    { key: 'scope', header: 'Escopo', render: (r) => <Chip tone={r.scope === 'GLOBAL' ? 'acc' : 'default'}>{r.scope}</Chip> },
    { key: 'description', header: 'Descrição', render: (r) => <span style={{ color: 'var(--text-3)' }}>{r.description ?? '—'}</span> },
  ]
  const permCols: Column<Permission>[] = [
    { key: 'resource', header: 'Recurso', mono: true },
    { key: 'action', header: 'Ação', mono: true },
    { key: 'scopeType', header: 'Escopo', mono: true, render: (r) => <Chip>{r.scopeType}</Chip> },
  ]

  return (
    <div>
      <PageHeader title="Papéis & RBAC" subtitle="Controle de acesso baseado em papéis · escopos GLOBAL → MERCHANT" />
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle badge={<Chip tone="acc">/roles</Chip>}>Papéis ({roleRows.length})</SectionTitle>
        <DataTable columns={roleCols} rows={roleRows} loading={roles.isLoading} error={roles.error} />
      </Card>
      <Card>
        <SectionTitle badge={<Chip tone="acc">/permissions</Chip>}>Permissões ({permRows.length})</SectionTitle>
        <DataTable columns={permCols} rows={permRows} loading={perms.isLoading} error={perms.error} />
      </Card>
    </div>
  )
}
