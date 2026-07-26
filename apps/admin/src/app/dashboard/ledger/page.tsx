'use client'

import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, asArray } from '@/components/ui'
import { useMe, useApi } from '@/lib/hooks'

interface Account { id: string; code: string; name: string; type: string; currency: string }
interface JournalEntry { id: string; description: string; status: string; postedAt: string }

// Estrutura de contas administrativas (contas-pote) — treasury interno da plataforma.
const ADMIN_ACCOUNTS = [
  { code: '0', name: 'Conta de tarifas', desc: 'Toda receita de transações cai aqui via split interno (independente do merchant)' },
  { code: '1', name: 'Pote — Merchant Paraguai', desc: 'Saldo dos clientes que liquidam via CNPJ da empresa (Bolsão Paraguai)' },
  { code: '2', name: 'Pote — Merchant Exchange', desc: 'Saldo dos clientes que liquidam via CNPJ da empresa (Exchanges)' },
  { code: '10', name: 'Conta da empresa', desc: 'Conta da empresa para pagamentos e fluxo financeiro' },
  { code: '12', name: 'Conta câmbio', desc: 'Saldo de clientes para câmbio e ordens de liquidez/remessas' },
  { code: '100', name: 'Conta de bloqueios', desc: 'Saldo de clientes bloqueados pelo compliance' },
]

export default function LedgerGlobal() {
  const me = useMe()
  const orgId = me.data?.orgId
  const accounts = useApi<unknown>(['gl-accounts', orgId], orgId ? `/api/v1/ledger/accounts?orgId=${orgId}` : null)
  const entries = useApi<unknown>(['gl-journal', orgId], orgId ? `/api/v1/ledger/journal-entries?orgId=${orgId}&limit=25` : null)
  const accRows = asArray<Account>(accounts.data)
  const entRows = asArray<JournalEntry>(entries.data)

  const accCols: Column<Account>[] = [
    { key: 'code', header: 'Código', mono: true },
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
      <PageHeader title="Ledger global" subtitle="Contabilidade double-entry · contas administrativas (pote) e razão da matriz" action={<button className="btn">Trial balance</button>} />

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle badge={<Chip tone="acc">estrutura · treasury</Chip>}>Contas administrativas (pote)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
          {ADMIN_ACCOUNTS.map((a) => (
            <div key={a.code} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 11, padding: '12px 13px', display: 'flex', gap: 12 }}>
              <div className="num" style={{ minWidth: 42, height: 42, borderRadius: 9, background: 'var(--accent-dim)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 15 }}>{a.code}</div>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{a.desc}</div></div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 12, marginBottom: 0 }}>Contas administrativas — serão materializadas como <span className="num">LedgerAccount</span> dedicadas; todo split (ex.: receita → Conta 0) passa pelo ledger double-entry.</p>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle badge={<Chip tone="acc">/ledger/journal-entries</Chip>}>Lançamentos</SectionTitle>
        <DataTable columns={entCols} rows={entRows} loading={entries.isLoading || me.isLoading} error={entries.error} emptyText="Nenhum lançamento." />
      </Card>
      <Card>
        <SectionTitle badge={<Chip tone="acc">/ledger/accounts</Chip>}>Plano de contas ({accRows.length})</SectionTitle>
        <DataTable columns={accCols} rows={accRows} loading={accounts.isLoading || me.isLoading} error={accounts.error} />
      </Card>
    </div>
  )
}
