'use client'

import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip } from '@/components/ui'

const DOMAINS = [
  { k: 'KYC', d: 'Verificação de identidade (pessoa física)' },
  { k: 'KYB', d: 'Verificação de empresas (know your business)' },
  { k: 'AML', d: 'Monitoramento antilavagem · regras de transação' },
  { k: 'PEP', d: 'Pessoas politicamente expostas' },
  { k: 'Sanções', d: 'Listas OFAC / ONU / UE' },
  { k: 'Travel Rule', d: 'Originador e beneficiário em transferências crypto' },
]

export default function Compliance() {
  return (
    <div>
      <PageHeader title="Compliance" subtitle="AML · KYC · KYB · PEP · Sanções · Travel Rule · LGPD/GDPR" action={<button className="btn">Regras de risco</button>} />
      <StatGrid cols={4}>
        <Stat label="Fila de análise" value="0" sub="pendências" tone="muted" />
        <Stat label="Sanções (hits)" value="0" sub="OFAC/ONU/UE" tone="pos" />
        <Stat label="Alertas AML" value="0" sub="monitoramento" tone="muted" />
        <Stat label="Travel Rule" value="conforme" tone="pos" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <SectionTitle badge={<Chip tone="warn">estrutura · em construção</Chip>}>Domínios de compliance</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
          {DOMAINS.map((x) => (
            <div key={x.k} style={{ background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 11, padding: '12px 13px' }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{x.k}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{x.d}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 14, marginBottom: 0 }}>
          Módulo de compliance será implementado atrás do <span className="num">CompliancePort</span> (provedores plugáveis por país), conforme ARCHITECTURE.md.
        </p>
      </Card>
    </div>
  )
}
