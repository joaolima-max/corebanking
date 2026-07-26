'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader, Card, SectionTitle, Tabs, Field, Chip, DataTable, Column, Soon, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'

interface Line { id: string; direction: string; amount: string; ledgerAccountId: string }
interface Entry { id: string; description: string; status: string; postedAt: string; idempotencyKey?: string; lines?: Line[] }

export default function TransacaoDetalhe({ params }: { params: { id: string } }) {
  const entry = useApi<Entry>(['tx', params.id], `/api/v1/ledger/journal-entries/${params.id}`)
  const [tab, setTab] = useState('detalhes')
  const e = entry.data
  const lines = asArray<Line>(e?.lines)

  const lineCols: Column<Line>[] = [
    { key: 'direction', header: 'Direção', render: (r) => <Chip tone={r.direction === 'DEBIT' ? 'default' : 'acc'}>{r.direction}</Chip> },
    { key: 'ledgerAccountId', header: 'Conta contábil', mono: true, render: (r) => <span style={{ color: 'var(--text-3)' }}>{r.ledgerAccountId.slice(0, 14)}…</span> },
    { key: 'amount', header: 'Valor', align: 'right', mono: true, render: (r) => `R$ ${r.amount}` },
  ]

  return (
    <div>
      <PageHeader
        title="Transação"
        subtitle={<><Link href="/dashboard/transacoes" style={{ color: 'var(--text-3)' }}>Transações</Link> / <span className="num">{params.id.slice(0, 14)}…</span></>}
        action={<Soon label="Contestar / MED" note="Abrir infração (MED) sobre esta transação — será ligado ao módulo de Infrações nesta fase." />}
      />

      <Card>
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: 'detalhes', label: 'Detalhes' },
            { key: 'e2e', label: 'E2E' },
            { key: 'extrato', label: 'Extrato (partidas)' },
            { key: 'seller', label: 'Seller' },
          ]}
        />

        {tab === 'detalhes' && (
          entry.isLoading ? <div style={{ color: 'var(--text-3)' }}>Carregando…</div> :
          entry.isError ? <div style={{ color: 'var(--neg)' }}>Transação não encontrada.</div> :
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field k="ID" v={e?.id ?? '—'} mono />
            <Field k="Descrição" v={e?.description ?? '—'} />
            <Field k="Status" v={<Chip tone={e?.status === 'POSTED' ? 'pos' : 'warn'}>{e?.status ?? '—'}</Chip>} />
            <Field k="Data" v={e?.postedAt ? new Date(e.postedAt).toLocaleString('pt-BR') : '—'} />
            <Field k="Idempotency key" v={e?.idempotencyKey ?? '—'} mono />
          </div>
        )}

        {tab === 'e2e' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field k="EndToEndId (PIX)" v={<span className="num">E2E{params.id.replace(/[^a-z0-9]/gi, '').slice(0, 20).toUpperCase()}</span>} />
            <Field k="Rail" v={<Chip tone="acc">PIX · instantâneo</Chip>} />
            <Field k="Pagador" v="Cliente ····3921 · BR" />
            <Field k="Recebedor (merchant)" v="Bolsão Paraguai" />
            <Field k="Liquidação" v="⚡ tempo real" />
            <div style={{ gridColumn: '1 / -1', color: 'var(--text-3)', fontSize: 12 }}>Consulta E2E junto ao rail/DICT será ligada ao InstantPaymentPort nesta fase.</div>
          </div>
        )}

        {tab === 'extrato' && (
          <div>
            <SectionTitle>Partidas dobradas desta transação</SectionTitle>
            <DataTable columns={lineCols} rows={lines} loading={entry.isLoading} error={entry.error} emptyText="Sem linhas contábeis nesta transação." />
          </div>
        )}

        {tab === 'seller' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field k="Seller / Submerchant" v="Distribuidora Norte" />
            <Field k="Documento" v={<span className="num">**.***.***/0001-**</span>} />
            <Field k="Merchant" v="Bolsão Paraguai" />
            <Field k="Status KYC" v={<Chip tone="pos">Aprovado</Chip>} />
            <div style={{ gridColumn: '1 / -1' }}><Link className="btn" href="/dashboard/submerchants">Ver submerchant →</Link></div>
          </div>
        )}
      </Card>
    </div>
  )
}
