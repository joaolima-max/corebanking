'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Soon } from '@/components/ui'
const DOCS = [
  { d: 'Documento de identidade', st: 'Aprovado', tone: 'pos' as const },
  { d: 'Comprovante de endereço', st: 'Aprovado', tone: 'pos' as const },
  { d: 'Selfie de verificação', st: 'Pendente', tone: 'warn' as const },
]
export default function Kyc() {
  return (
    <div>
      <PageHeader title="Verificação (KYC)" subtitle="Envie seus documentos para liberar todos os recursos da conta" action={<Soon label="Enviar documento" note="Upload de documento — será ligado ao módulo KYC (CompliancePort) nesta fase." />} />
      <StatGrid cols={3}>
        <Stat label="Nível da conta" value="Verificado" tone="pos" /><Stat label="Limite liberado" value="R$ 500k/dia" tone="muted" /><Stat label="Pendências" value="1" tone="warn" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Seus documentos</SectionTitle>
        {DOCS.map((x) => (
          <div key={x.d} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{ flex: 1, fontSize: 13 }}>{x.d}</div><Chip tone={x.tone}>{x.st}</Chip>
          </div>
        ))}
      </Card>
    </div>
  )
}
