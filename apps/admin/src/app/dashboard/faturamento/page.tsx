'use client'

import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Tabs, DataTable, Column, Soon } from '@/components/ui'

const FATURAS = [
  { m: 'Bolsão Paraguai', tpv: 'R$ 64,2M', take: '0,79%', rev: 'R$ 507k', ciclo: 'Jul/2026' },
  { m: 'Exchanges Estrangeiras', tpv: 'R$ 48,9M', take: '0,85%', rev: 'R$ 415k', ciclo: 'Jul/2026' },
]
const REGRAS = [
  { ev: 'QR Code gerado', base: 'por unidade', valor: 'R$ 0,02', tipo: 'fixo' },
  { ev: 'Cash in (PIX)', base: 'percentual', valor: '0,79%', tipo: 'percentual' },
  { ev: 'Cash out (PIX)', base: 'percentual + fixo', valor: '0,99% + R$ 0,10', tipo: 'misto' },
  { ev: 'Liquidação', base: 'por transação', valor: 'R$ 0,05', tipo: 'fixo' },
  { ev: 'Pagamento de contas (boleto)', base: 'por pagamento', valor: 'R$ 1,90', tipo: 'fixo' },
  { ev: 'Conversão FX', base: 'spread', valor: '1,20%', tipo: 'percentual' },
  { ev: 'Mensalidade', base: 'por mês', valor: 'R$ 99,00', tipo: 'recorrente' },
]
const SPLITS = [
  { nome: 'Split marketplace', tipo: 'percentual', regra: '90% seller / 10% plataforma' },
  { nome: 'Taxa de intermediação', tipo: 'fixo', regra: 'R$ 2,00 por transação para a plataforma' },
]
const MANUAIS = [
  { desc: 'Estorno de tarifa', cliente: 'Norte Digital', valor: '- R$ 120,00', dir: 'crédito' },
  { desc: 'Cobrança avulsa (setup)', cliente: 'Cross Pay SA', valor: '+ R$ 1.500,00', dir: 'débito' },
]

export default function Faturamento() {
  const [tab, setTab] = useState('faturas')
  return (
    <div>
      <PageHeader title="Faturamento & Tarifas" subtitle="Receita por merchant, regras de tarifa flexíveis, split, lançamentos manuais e cobranças programadas" />
      <StatGrid cols={4}>
        <Stat label="Receita (30d)" value="R$ 2,74M" tone="pos" />
        <Stat label="Take rate médio" value="0,88%" tone="muted" />
        <Stat label="Regras de tarifa" value={String(REGRAS.length)} tone="muted" />
        <Stat label="Splits ativos" value={String(SPLITS.length)} />
      </StatGrid>

      <Card style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} tabs={[
          { key: 'faturas', label: 'Faturas' },
          { key: 'regras', label: 'Regras de tarifa' },
          { key: 'split', label: 'Split' },
          { key: 'manuais', label: 'Lançamentos manuais' },
          { key: 'programadas', label: 'Tarifas programadas' },
        ]} />

        {tab === 'faturas' && (
          <DataTable rows={FATURAS} columns={[
            { key: 'm', header: 'Merchant', render: (r) => <b>{r.m}</b> },
            { key: 'tpv', header: 'TPV', mono: true }, { key: 'take', header: 'Take', mono: true },
            { key: 'rev', header: 'Receita', mono: true, align: 'right' }, { key: 'ciclo', header: 'Ciclo' },
          ] as Column<typeof FATURAS[number]>[]} />
        )}

        {tab === 'regras' && (
          <div>
            <SectionTitle badge={<Soon label="Nova regra" note="Editor de regra de tarifa (evento × base × valor × período) — será ligado ao módulo de pricing nesta fase." />}>Regras de tarifa (por QR, cash in/out, liquidação, boleto, FX, hora/dia/mês)</SectionTitle>
            <DataTable rows={REGRAS} columns={[
              { key: 'ev', header: 'Evento', render: (r) => <b>{r.ev}</b> },
              { key: 'base', header: 'Base de cálculo' },
              { key: 'valor', header: 'Valor', mono: true },
              { key: 'tipo', header: 'Tipo', render: (r) => <Chip tone={r.tipo === 'recorrente' ? 'acc' : 'default'}>{r.tipo}</Chip> },
            ] as Column<typeof REGRAS[number]>[]} />
          </div>
        )}

        {tab === 'split' && (
          <div>
            <SectionTitle badge={<Soon label="Novo split" note="Configuração de split fixo ou percentual — será ligada ao ledger (partidas por participante) nesta fase." />}>Split de pagamentos (fixo e percentual)</SectionTitle>
            <DataTable rows={SPLITS} columns={[
              { key: 'nome', header: 'Split', render: (r) => <b>{r.nome}</b> },
              { key: 'tipo', header: 'Tipo', render: (r) => <Chip tone="acc">{r.tipo}</Chip> },
              { key: 'regra', header: 'Regra' },
            ] as Column<typeof SPLITS[number]>[]} />
          </div>
        )}

        {tab === 'manuais' && (
          <div>
            <SectionTitle badge={<Soon label="Novo lançamento" note="Lançamento manual (cobrar cliente / creditar conta de receita — Conta 0) — será ligado ao ledger double-entry nesta fase." />}>Lançamentos manuais</SectionTitle>
            <DataTable rows={MANUAIS} columns={[
              { key: 'desc', header: 'Descrição', render: (r) => <b>{r.desc}</b> },
              { key: 'cliente', header: 'Cliente' },
              { key: 'dir', header: 'Direção', render: (r) => <Chip tone={r.dir === 'crédito' ? 'pos' : 'default'}>{r.dir}</Chip> },
              { key: 'valor', header: 'Valor', mono: true, align: 'right' },
            ] as Column<typeof MANUAIS[number]>[]} />
          </div>
        )}

        {tab === 'programadas' && (
          <div>
            <SectionTitle badge={<Soon label="Programar cobrança" note="Agendamento de tarifa/mensalidade recorrente — será ligado ao scheduler + ledger nesta fase." />}>Tarifas e mensalidades programadas</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
              {[['Mensalidade plataforma', 'R$ 99,00 / mês', 'todo dia 1º'], ['Tarifa de manutenção', 'R$ 19,90 / mês', 'todo dia 10'], ['Setup fee', 'R$ 1.500,00', 'única, no onboarding']].map((x) => (
                <div key={x[0]} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 11, padding: '12px 13px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{x[0]}</div>
                  <div className="num" style={{ fontSize: 15, margin: '6px 0 2px' }}>{x[1]}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{x[2]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
      <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 16 }}>Estrutura de pricing/billing — persistência e cálculo serão ligados ao ledger (Conta 0 = receita) nesta fase.</p>
    </div>
  )
}
