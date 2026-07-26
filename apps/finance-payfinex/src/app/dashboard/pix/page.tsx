'use client'

import { PageHeader, Card, SectionTitle, StatGrid, Stat, DataTable, Column, Chip, Soon, asArray } from '@/components/ui'
import { useApi } from '@/lib/hooks'

interface PixKey { id: string; keyType: string; keyValue: string; status: string }
interface PixTransfer { id: string; amount: string; status: string; createdAt: string }

export default function Pix() {
  const stats = useApi<Record<string, unknown>>(['pix-stats'], '/api/v1/pix/stats')
  const keys = useApi<unknown>(['pix-keys'], '/api/v1/pix/keys')
  const transfers = useApi<unknown>(['pix-transfers'], '/api/v1/pix/transfers')

  const keyRows = asArray<PixKey>(keys.data)
  const trRows = asArray<PixTransfer>(transfers.data)
  const s = (stats.data ?? {}) as Record<string, unknown>
  const num = (k: string) => (typeof s[k] === 'number' ? String(s[k]) : '—')

  const keyCols: Column<PixKey>[] = [
    { key: 'keyType', header: 'Tipo', render: (r) => <Chip>{r.keyType}</Chip> },
    { key: 'keyValue', header: 'Chave', mono: true },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'ACTIVE' ? 'pos' : 'warn'}>{r.status}</Chip> },
  ]
  const trCols: Column<PixTransfer>[] = [
    { key: 'id', header: 'ID', mono: true, render: (r) => <span style={{ color: 'var(--text-3)' }}>{r.id?.slice(0, 10)}…</span> },
    { key: 'amount', header: 'Valor', align: 'right', mono: true, render: (r) => `R$ ${r.amount}` },
    { key: 'status', header: 'Status', render: (r) => <Chip tone={r.status === 'COMPLETED' ? 'pos' : r.status === 'FAILED' ? 'neg' : 'warn'}>{r.status}</Chip> },
    { key: 'createdAt', header: 'Criado', render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : '—') },
  ]

  return (
    <div>
      <PageHeader title="Receber (PIX)" subtitle="Pagamento instantâneo · chaves, cobranças (QR) e transferências" action={<Soon label="＋ Nova cobrança" note="Emissão de cobrança PIX (QR dinâmico) — será ligada a /pix/qr-codes nesta fase." />} />

      <StatGrid cols={4}>
        <Stat label="Chaves ativas" value={keys.isLoading ? '…' : String(keyRows.length)} sub="do tenant" tone="muted" />
        <Stat label="Transferências" value={transfers.isLoading ? '…' : String(trRows.length)} sub="⚡ instantâneas" />
        <Stat label="Recebido (30d)" value={num('totalReceived') === '—' ? 'R$ —' : `R$ ${num('totalReceived')}`} tone="pos" />
        <Stat label="Tempo médio" value="1,9s" sub="⚡ instantâneo" />
      </StatGrid>

      <Card style={{ marginTop: 14, marginBottom: 14 }}>
        <SectionTitle badge={<Chip tone="acc">ao vivo /pix/keys</Chip>}>Chaves PIX</SectionTitle>
        <DataTable columns={keyCols} rows={keyRows} loading={keys.isLoading} error={keys.error} emptyText="Nenhuma chave PIX cadastrada. Crie uma para começar a receber." />
      </Card>

      <Card>
        <SectionTitle badge={<Chip tone="acc">ao vivo /pix/transfers</Chip>}>Transferências recentes</SectionTitle>
        <DataTable columns={trCols} rows={trRows} loading={transfers.isLoading} error={transfers.error} emptyText="Nenhuma transferência ainda." />
      </Card>
    </div>
  )
}
