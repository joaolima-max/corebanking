'use client'
import Link from 'next/link'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Soon } from '@/components/ui'

const MERCHANTS = [
  { id: 'mrc_py_bolsao', name: 'Bolsão Paraguai', desc: 'Conta bolsão p/ receber PIX de brasileiros (BRL) para clientes do Paraguai', subs: 14, ccy: 'BRL → PYG' },
  { id: 'mrc_exchanges', name: 'Exchanges Estrangeiras', desc: 'Recebimento em nome de exchanges estrangeiras no Brasil', subs: 6, ccy: 'BRL / USDC' },
]

export default function Merchants() {
  return (
    <div>
      <PageHeader title="Merchants" subtitle="Ambientes do grupo (todos da Bass Pago). Cada merchant é um tipo de operação; seus clientes finais são submerchants." action={<Soon label="Novo merchant" note="Criação de merchant (ambiente do grupo) — será ligada à API nesta fase." />} />
      <StatGrid cols={3}>
        <Stat label="Merchants" value={String(MERCHANTS.length)} tone="muted" />
        <Stat label="Submerchants" value="20" sub="clientes finais" />
        <Stat label="Corredores" value="BRL·PYG·USDC" tone="muted" />
      </StatGrid>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 14, marginTop: 14 }}>
        {MERCHANTS.map((m) => (
          <Card key={m.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><b style={{ fontSize: 15 }}>{m.name}</b><div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, maxWidth: 320 }}>{m.desc}</div></div>
              <Chip tone="acc">merchant</Chip>
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
              <div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>Submerchants</div><div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{m.subs}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>Moedas</div><div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{m.ccy}</div></div>
            </div>
            <div style={{ marginTop: 14 }}><Link href="/dashboard/submerchants" className="btn">Ver submerchants →</Link></div>
          </Card>
        ))}
      </div>
      <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 16 }}>Estrutura de merchants — a persistência será ligada a <span className="num">Organization(type=MERCHANT)</span> no backend nesta fase.</p>
    </div>
  )
}
