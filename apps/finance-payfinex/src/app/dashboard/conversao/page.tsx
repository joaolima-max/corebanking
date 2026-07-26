'use client'

import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Soon } from '@/components/ui'

const CCY = ['BRL', 'USD']

export default function Conversao() {
  const [from, setFrom] = useState('BRL')
  const [to, setTo] = useState('USD')
  const [amt, setAmt] = useState('')
  return (
    <div>
      <PageHeader title="Converter (BRL ⇄ USD)" subtitle="Câmbio entre Real e Dólar · liquidação em tempo real" />
      <StatGrid cols={3}>
        <Stat label="BRL → USD" value="0,182" tone="muted" />
        <Stat label="USD → BRL" value="5,49" tone="muted" />
        <Stat label="Spread" value="0,6%" />
      </StatGrid>
      <Card style={{ marginTop: 14, maxWidth: 520 }}>
        <SectionTitle>Nova conversão</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>De</div>
            <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>{CCY.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Para</div>
            <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>{CCY.map((c) => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Valor</div>
        <input className="input" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0,00" inputMode="decimal" style={{ marginBottom: 16 }} />
        <Soon label="Converter" note="Conversão BRL ⇄ USD — será ligada ao FX nesta fase." />
      </Card>
    </div>
  )
}
