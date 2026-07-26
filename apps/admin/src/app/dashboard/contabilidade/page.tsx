'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Tabs, DataTable, Column, Soon, AreaChart } from '@/components/ui'
const BAL = [
  { c: 'Ativo — Caixa e equivalentes', v: 'R$ 92,4M', t: 'ASSET' },
  { c: 'Ativo — A receber', v: 'R$ 18,1M', t: 'ASSET' },
  { c: 'Passivo — Saldo de clientes', v: 'R$ 104,2M', t: 'LIABILITY' },
  { c: 'Passivo — A pagar', v: 'R$ 3,4M', t: 'LIABILITY' },
  { c: 'Patrimônio líquido', v: 'R$ 2,9M', t: 'EQUITY' },
]
const TES = [
  { conta: 'Conta 0 — Tarifas (receita)', ccy: 'BRL', saldo: 'R$ 2,74M' },
  { conta: 'Conta 1 — Pote Paraguai', ccy: 'BRL', saldo: 'R$ 31,1M' },
  { conta: 'Conta 2 — Pote Exchange', ccy: 'USDC', saldo: '8,24M' },
  { conta: 'Conta 12 — Câmbio', ccy: 'multi', saldo: 'R$ 14,2M' },
  { conta: 'Conta 100 — Bloqueios', ccy: 'BRL', saldo: 'R$ 0,9M' },
]
export default function Contabilidade() {
  const [tab, setTab] = useState('conciliacao')
  return (
    <div>
      <PageHeader title="Contabilidade" subtitle="Conciliação, balanço (ativo/passivo), tesouraria de contas e moedas" action={<Soon label="Fechar período" note="Fechamento contábil do período — será ligado ao ledger nesta fase." />} />
      <StatGrid cols={4}>
        <Stat label="Ativo total" value="R$ 110,5M" tone="muted" />
        <Stat label="Passivo total" value="R$ 107,6M" tone="muted" />
        <Stat label="Conciliação" value="100%" tone="pos" sub="batendo" />
        <Stat label="Contas de tesouraria" value={String(TES.length)} />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} tabs={[{ key: 'conciliacao', label: 'Conciliação' }, { key: 'balanco', label: 'Balanço' }, { key: 'tesouraria', label: 'Tesouraria' }]} />
        {tab === 'conciliacao' && (
          <div>
            <SectionTitle badge={<Chip tone="pos">batendo</Chip>}>Conciliação diária (ledger × extrato bancário)</SectionTitle>
            <AreaChart data={[98.9, 99.2, 100, 99.8, 100, 100, 99.9, 100, 100, 100, 99.7, 100, 100, 100]} color="var(--pos)" />
            <p style={{ color: 'var(--text-3)', fontSize: 12 }}>Conciliação automática entre lançamentos do ledger e movimentações dos rails — será ligada nesta fase.</p>
          </div>
        )}
        {tab === 'balanco' && (
          <DataTable rows={BAL} columns={[
            { key: 'c', header: 'Conta', render: (r) => <b>{r.c}</b> },
            { key: 't', header: 'Natureza', render: (r) => <Chip tone={r.t === 'LIABILITY' ? 'warn' : r.t === 'EQUITY' ? 'acc' : 'default'}>{r.t}</Chip> },
            { key: 'v', header: 'Saldo', mono: true, align: 'right' },
          ] as Column<typeof BAL[number]>[]} />
        )}
        {tab === 'tesouraria' && (
          <DataTable rows={TES} columns={[
            { key: 'conta', header: 'Conta', render: (r) => <b>{r.conta}</b> },
            { key: 'ccy', header: 'Moeda', mono: true },
            { key: 'saldo', header: 'Saldo', mono: true, align: 'right' },
          ] as Column<typeof TES[number]>[]} />
        )}
      </Card>
    </div>
  )
}
