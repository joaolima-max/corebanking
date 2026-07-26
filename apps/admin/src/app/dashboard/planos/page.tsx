'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, Chip, Tabs, DataTable, Column, Soon } from '@/components/ui'
const PLANOS = [
  { nome: 'Starter', diario: 'R$ 50k', tx: 'R$ 10k', taxa: '1,20%', alvo: 'novos submerchants' },
  { nome: 'Growth', diario: 'R$ 500k', tx: 'R$ 50k', taxa: '0,99%', alvo: 'em operação' },
  { nome: 'Scale', diario: 'R$ 5M', tx: 'R$ 500k', taxa: '0,79%', alvo: 'alto volume' },
  { nome: 'Enterprise', diario: 'sob medida', tx: 'sob medida', taxa: 'negociada', alvo: 'grandes contas' },
]
export default function Planos() {
  const [tab, setTab] = useState('planos')
  return (
    <div>
      <PageHeader title="Planos & Limites" subtitle="Planos padrão de limites e taxas — atribua um plano ao cliente assim que ele passar pelo KYC" action={<Soon label="Novo plano" note="Criação de plano padrão (limites + taxas) — será ligado a TenantPricing/Limits nesta fase." />} />
      <Card>
        <Tabs active={tab} onChange={setTab} tabs={[{ key: 'planos', label: 'Planos padrão' }, { key: 'atribuir', label: 'Atribuir plano (pós-KYC)' }]} />
        {tab === 'planos' && (
          <DataTable rows={PLANOS} columns={[
            { key: 'nome', header: 'Plano', render: (r) => <b>{r.nome}</b> },
            { key: 'diario', header: 'Limite diário', mono: true },
            { key: 'tx', header: 'Por transação', mono: true },
            { key: 'taxa', header: 'Taxa', mono: true },
            { key: 'alvo', header: 'Indicado para', render: (r) => <span style={{ color: 'var(--text-3)' }}>{r.alvo}</span> },
          ] as Column<typeof PLANOS[number]>[]} />
        )}
        {tab === 'atribuir' && (
          <div style={{ maxWidth: 460 }}>
            <SectionTitle badge={<Chip tone="acc">pós-KYC</Chip>}>Selecionar cliente e plano</SectionTitle>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Submerchant (KYC aprovado)</div>
            <select className="input" style={{ marginBottom: 12 }}><option>Distribuidora Norte</option><option>Tienda Sol</option><option>Cross Pay SA</option></select>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Plano</div>
            <select className="input" style={{ marginBottom: 16 }}>{PLANOS.map((p) => <option key={p.nome}>{p.nome}</option>)}</select>
            <Soon label="Atribuir plano" note="Vincula o plano ao submerchant (aplica limites e taxas) — será ligado à API nesta fase." />
          </div>
        )}
      </Card>
    </div>
  )
}
