'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Tabs, Field, DataTable, Column, Soon, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'

interface Client { id: string; slug: string; name: string; type: string; status: string; settings?: { country?: string; currency?: string }; createdAt?: string }

const FEATURES = [
  { key: 'cashin', label: 'Cash in (receber)', desc: 'Permite receber pagamentos' },
  { key: 'cashout', label: 'Cash out (sacar)', desc: 'Permite saques/payouts' },
  { key: 'payments', label: 'Pagamentos', desc: 'Permite enviar pagamentos' },
  { key: 'fx', label: 'Conversão / FX', desc: 'Permite conversão de moedas' },
  { key: 'crypto', label: 'Stablecoins', desc: 'Permite operar USDC/USDT' },
]

export default function SubmerchantDetail({ params }: { params: { id: string } }) {
  const client = useApi<Client>(['client', params.id], `/api/v1/admin/clients/${params.id}`)
  const [tab, setTab] = useState('overview')
  const [flags, setFlags] = useState<Record<string, boolean>>({ cashin: true, cashout: true, payments: true, fx: true, crypto: false })
  const [blocked, setBlocked] = useState(false)
  const c = client.data

  const subCols: Column<{ name: string; type: string; ccy: string; status: string }>[] = [
    { key: 'name', header: 'Subconta', render: (r) => <b>{r.name}</b> },
    { key: 'type', header: 'Tipo', render: (r) => <Chip>{r.type}</Chip> },
    { key: 'ccy', header: 'Moeda', mono: true },
    { key: 'status', header: 'Status', render: (r) => <Chip tone="pos">{r.status}</Chip> },
  ]
  const subRows = [
    { name: 'Conta operacional', type: 'OPERATIONAL', ccy: 'BRL', status: 'ACTIVE' },
    { name: 'Conta de liquidação', type: 'SETTLEMENT', ccy: 'BRL', status: 'ACTIVE' },
  ]

  return (
    <div>
      <PageHeader
        title={c ? c.name : 'Submerchant'}
        subtitle={<><Link href="/dashboard/submerchants" style={{ color: 'var(--text-3)' }}>Submerchants</Link> / <span className="num">{params.id.slice(0, 12)}…</span></>}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => setBlocked((b) => !b)} style={blocked ? { color: 'var(--pos)' } : { color: 'var(--neg)' }}>
              {blocked ? 'Desbloquear conta' : 'Bloquear conta'}
            </button>
            <Soon label="Solicitar documentos" note="Solicitação de documentos ao submerchant — será ligada ao módulo KYC nesta fase." />
            <Soon label="Solicitar assinatura" note="Envio de contrato/termos para assinatura — será ligado ao módulo de contratos nesta fase." />
          </div>
        }
      />

      {blocked && <div style={{ marginBottom: 14 }}><Chip tone="neg">Conta bloqueada</Chip></div>}

      <StatGrid cols={4}>
        <Stat label="Status" value={c?.status ?? '—'} tone={c?.status === 'ACTIVE' ? 'pos' : 'muted'} />
        <Stat label="País" value={c?.settings?.country ?? '—'} tone="muted" />
        <Stat label="Moeda" value={c?.settings?.currency ?? '—'} tone="muted" />
        <Stat label="Funções ativas" value={String(Object.values(flags).filter(Boolean).length)} sub="de 5" />
      </StatGrid>

      <Card style={{ marginTop: 14 }}>
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'overview', label: 'Visão geral' },
            { key: 'limits', label: 'Limites & Taxas' },
            { key: 'subaccounts', label: 'Subcontas' },
            { key: 'features', label: 'Funcionalidades' },
          ]}
        />

        {tab === 'overview' && (
          client.isLoading ? <div style={{ color: 'var(--text-3)' }}>Carregando…</div> :
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field k="Nome" v={c?.name ?? '—'} />
            <Field k="Slug" v={c?.slug ?? '—'} mono />
            <Field k="ID" v={params.id} mono />
            <Field k="Tipo" v={<Chip>{c?.type ?? '—'}</Chip>} />
            <Field k="Criado" v={c?.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '—'} />
          </div>
        )}

        {tab === 'limits' && (
          <div>
            <SectionTitle>Limites operacionais</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginBottom: 16 }}>
              <LimitField label="Limite diário (cash in)" defaultValue="R$ 500.000,00" />
              <LimitField label="Limite diário (cash out)" defaultValue="R$ 200.000,00" />
              <LimitField label="Limite por transação" defaultValue="R$ 50.000,00" />
              <LimitField label="Saldo máximo em custódia" defaultValue="R$ 2.000.000,00" />
            </div>
            <SectionTitle>Taxas</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14 }}>
              <LimitField label="Taxa PIX in (%)" defaultValue="0,79" />
              <LimitField label="Taxa PIX out (%)" defaultValue="0,99" />
              <LimitField label="Spread FX (%)" defaultValue="1,20" />
              <LimitField label="Tarifa fixa por transação" defaultValue="R$ 0,10" />
            </div>
            <div style={{ marginTop: 16 }}><Soon label="Salvar alterações" note="Persistência de limites e taxas — será ligada ao módulo de pricing/limits nesta fase." /></div>
          </div>
        )}

        {tab === 'subaccounts' && (
          <div>
            <SectionTitle badge={<Soon label="Criar subconta" note="Criação de subconta para o submerchant — será ligada a /accounts nesta fase." />}>Subcontas</SectionTitle>
            <DataTable columns={subCols} rows={subRows} />
          </div>
        )}

        {tab === 'features' && (
          <div>
            <SectionTitle>Funcionalidades habilitadas</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FEATURES.map((f) => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{f.label}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{f.desc}</div></div>
                  <Toggle on={!!flags[f.key]} onClick={() => setFlags((s) => ({ ...s, [f.key]: !s[f.key] }))} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}><Soon label="Aplicar" note="As mudanças de funcionalidade serão persistidas em TenantProducts (feature flags por submerchant) nesta fase." /></div>
          </div>
        )}
      </Card>
    </div>
  )
}

function LimitField({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>{label}</div>
      <input className="input" defaultValue={defaultValue} style={{ padding: '8px 10px', fontSize: 13 }} />
    </div>
  )
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on} style={{ width: 42, height: 24, borderRadius: 20, border: '1px solid var(--border)', background: on ? 'var(--accent)' : 'var(--surface-2)', position: 'relative', cursor: 'pointer', transition: 'background .15s' }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: on ? '#07120e' : 'var(--text-3)', transition: 'left .15s' }} />
    </button>
  )
}
