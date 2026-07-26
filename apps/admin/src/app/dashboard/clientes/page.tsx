'use client'

import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'

interface Client { id: string; slug: string; name: string; type: string; status: string; settings?: { country?: string; currency?: string }; createdAt: string }
const TYPE_LABEL: Record<string, string> = { BASS: 'Plataforma', WHITE_LABEL: 'White Label', COMPANY: 'Empresa', MERCHANT: 'Merchant' }

export default function Clientes() {
  const clients = useApi<unknown>(['admin-clients-full'], '/api/v1/admin/clients')
  const rows = asArray<Client>(clients.data)
  const cols: Column<Client>[] = [
    { key: 'name', header: 'Cliente', render: (r) => (<div><div style={{ fontWeight: 600 }}>{r.name} {r.type === 'WHITE_LABEL' && <Chip tone="acc">white-label</Chip>}</div><div className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.slug}</div></div>) },
    { key: 'type', header: 'Tipo', render: (r) => TYPE_LABEL[r.type] ?? r.type },
    { key: 'country', header: 'País', render: (r) => r.settings?.country ?? '—' },
    { key: 'currency', header: 'Moeda', mono: true, render: (r) => r.settings?.currency ?? '—' },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'ACTIVE' ? 'pos' : 'warn'}>{r.status}</Chip> },
    { key: 'createdAt', header: 'Criado', align: 'right', render: (r) => new Date(r.createdAt).toLocaleDateString('pt-BR') },
  ]
  return (
    <div>
      <PageHeader title="Clientes" subtitle="Todos os tenants do gateway · isolados entre si" action={<button className="btn primary">Provisionar cliente</button>} />
      <Card>
        <SectionTitle badge={<Chip tone="acc">GLOBAL · /admin/clients</Chip>}>{rows.length} clientes</SectionTitle>
        <DataTable columns={cols} rows={rows} loading={clients.isLoading} error={clients.error} emptyText="Nenhum cliente cadastrado." />
      </Card>
    </div>
  )
}
