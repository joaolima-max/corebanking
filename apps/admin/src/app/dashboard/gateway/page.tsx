'use client'

import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip } from '@/components/ui'

const RAILS = [
  { n: 'PIX (BR)', m: 'instantâneo · DICT · SPI', h: 99.9 },
  { n: 'SPEI (MX)', m: 'instantâneo · CoDi', h: 99.6 },
  { n: 'Stablecoin USDC/USDT', m: 'liquidação instantânea · EVM · Solana · Stellar', h: 99.99 },
  { n: 'Transferência instantânea PY', m: 'SIPAP', h: 99.1 },
  { n: 'FX corredores', m: 'conversão instantânea', h: 99.5 },
  { n: 'Mojaloop switch', m: 'interoperabilidade FSPIOP', h: 99.8 },
]

export default function Gateway() {
  return (
    <div>
      <PageHeader title="Gateway instantâneo" subtitle="Pagamento em tempo real multi-moeda · Mojaloop · sem cartão" action={<button className="btn primary">Adicionar rail</button>} />
      <StatGrid cols={4}>
        <Stat label="Rails instantâneos" value="9" sub="saudáveis" tone="pos" />
        <Stat label="Moedas" value="10" sub="fiat + stablecoin" tone="muted" />
        <Stat label="Liquidação média" value="1,8s" sub="tempo real" />
        <Stat label="Interoperabilidade" value="FSPIOP" sub="Mojaloop" tone="muted" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <SectionTitle badge={<Chip tone="acc">Mojaloop</Chip>}>Rails instantâneos</SectionTitle>
        {RAILS.map((r) => (
          <div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{r.n}</div><div style={{ fontSize: 11, color: 'var(--text-3)' }}>{r.m}</div></div>
            <div style={{ flex: '0 0 120px', height: 7, borderRadius: 5, background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${r.h}%`, background: 'var(--accent)', borderRadius: 5 }} />
            </div>
            <div className="num" style={{ width: 52, textAlign: 'right', color: 'var(--text-2)' }}>{r.h}%</div>
            <Chip tone="pos">ok</Chip>
          </div>
        ))}
      </Card>
    </div>
  )
}
