'use client'
import Link from 'next/link'
import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, Soon, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'

interface Client { id: string; slug: string; name: string; type: string; status: string; settings?: { country?: string; currency?: string } }

export default function Submerchants() {
  const clients = useApi<unknown>(['admin-clients-sub'], '/api/v1/admin/clients')
  const rows = asArray<Client>(clients.data)
  const cols: Column<Client>[] = [
    { key: 'name', header: 'Submerchant', render: (r) => (<div><div style={{ fontWeight: 600 }}>{r.name}</div><div className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.slug}</div></div>) },
    { key: 'country', header: 'País', render: (r) => r.settings?.country ?? '—' },
    { key: 'currency', header: 'Moeda', mono: true, render: (r) => r.settings?.currency ?? '—' },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'ACTIVE' ? 'pos' : 'warn'}>{r.status}</Chip> },
    { key: 'actions', header: '', align: 'right', render: (r) => <Link className="btn" href={`/dashboard/submerchants/${r.id}`} style={{ padding: '5px 10px', fontSize: 12 }}>Detalhes →</Link> },
  ]
  return (
    <div>
      <PageHeader title="Submerchants" subtitle="Clientes finais de cada merchant · limites, taxas, subcontas e funcionalidades" action={<Soon label="Provisionar submerchant" note="Onboarding de submerchant — será ligado à API nesta fase." />} />
      <Card>
        <SectionTitle badge={<Chip tone="acc">/admin/clients</Chip>}>{rows.length} submerchants</SectionTitle>
        <DataTable columns={cols} rows={rows} loading={clients.isLoading} error={clients.error} emptyText="Nenhum submerchant." />
      </Card>
    </div>
  )
}
