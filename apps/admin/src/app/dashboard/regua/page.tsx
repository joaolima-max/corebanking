'use client'
import { PageHeader, Card, SectionTitle, Chip, Soon } from '@/components/ui'
const RULES = [
  { r: 'Limite de cash out diário por score', on: true },
  { r: 'Bloqueio em velocity > 20 tx/min', on: true },
  { r: 'Revisão manual acima de R$ 50.000', on: true },
  { r: 'Hold de 24h para novos submerchants', on: false },
]
export default function Regua() {
  return (
    <div>
      <PageHeader title="Régua de risco" subtitle="Regras e políticas de risco aplicadas às transações e contas" action={<Soon label="Nova regra" note="Editor de regras (régua) — será ligado ao motor de risco nesta fase." />} />
      <Card>
        <SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Regras ativas</SectionTitle>
        {RULES.map((x) => (
          <div key={x.r} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ flex: 1, fontSize: 13 }}>{x.r}</div>
            <Chip tone={x.on ? 'pos' : 'default'}>{x.on ? 'ativa' : 'inativa'}</Chip>
          </div>
        ))}
      </Card>
    </div>
  )
}
