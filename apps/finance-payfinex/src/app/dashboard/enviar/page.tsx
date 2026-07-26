'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, DataTable, Column, Chip, Soon, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'
interface PixTransfer { id: string; amount: string; status: string; createdAt: string }
export default function Enviar() {
  const [key, setKey] = useState(''); const [amount, setAmount] = useState('')
  const transfers = useApi<unknown>(['pix-transfers-out'], '/api/v1/pix/transfers')
  const rows = asArray<PixTransfer>(transfers.data)
  const cols: Column<PixTransfer>[] = [
    { key: 'id', header: 'ID', mono: true, render: (r) => <span style={{ color: 'var(--text-3)' }}>{r.id?.slice(0, 10)}…</span> },
    { key: 'amount', header: 'Valor', align: 'right', mono: true, render: (r) => `R$ ${r.amount}` },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'COMPLETED' ? 'pos' : r.status === 'FAILED' ? 'neg' : 'warn'}>{r.status}</Chip> },
    { key: 'createdAt', header: 'Criado', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : '—') },
  ]
  return (
    <div>
      <PageHeader title="Enviar dinheiro" subtitle="Payout instantâneo via PIX · liquidação em tempo real" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14 }}>
        <Card>
          <SectionTitle>Novo envio</SectionTitle>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Chave PIX do destinatário</div>
          <input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="e-mail, CPF/CNPJ, telefone ou EVP" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Valor (R$)</div>
          <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" style={{ marginBottom: 16 }} />
          <Soon label="Enviar agora" note="Envio instantâneo — será ligado a POST /pix/transfers (idempotente) nesta fase." />
        </Card>
        <Card>
          <SectionTitle badge={<Chip tone="acc">ao vivo /pix/transfers</Chip>}>Envios recentes</SectionTitle>
          <DataTable columns={cols} rows={rows} loading={transfers.isLoading} error={transfers.error} emptyText="Nenhum envio ainda." />
        </Card>
      </div>
    </div>
  )
}
