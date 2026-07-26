'use client'

import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Soon } from '@/components/ui'

const RATE = 1470 // 1 BRL = ₲1.470

export default function Conversao() {
  const [amt, setAmt] = useState('')
  const brl = parseFloat((amt || '0').replace(/\./g, '').replace(',', '.')) || 0
  const pyg = brl * RATE
  return (
    <div>
      <PageHeader title="Converter para Guarani" subtitle="Receba em Real e converta para Guarani na hora — simples, com a melhor cotação" />
      <StatGrid cols={3}>
        <Stat label="1 BRL =" value="₲ 1.470" tone="muted" />
        <Stat label="Seu saldo em Real" value="R$ 12.480,00" />
        <Stat label="Conversão" value="⚡ na hora" tone="pos" />
      </StatGrid>
      <Card style={{ marginTop: 14, maxWidth: 520 }}>
        <SectionTitle>Quanto você quer converter?</SectionTitle>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Valor em Real (BRL)</div>
        <input className="input" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="0,00" inputMode="decimal" style={{ marginBottom: 12 }} />
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 11, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Você recebe em Guarani</div>
          <div className="num" style={{ fontSize: 26, fontWeight: 680, color: 'var(--accent)', letterSpacing: '-0.03em' }}>₲ {pyg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
        </div>
        <Soon label="Converter para Guarani" note="Conversão BRL → Guarani na hora — será ligada ao FX nesta fase." />
      </Card>
      <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 16 }}>Conversão automática com liquidação em tempo real. Você só vê Real e Guarani — do resto cuidamos nós.</p>
    </div>
  )
}
