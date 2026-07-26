'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, Soon } from '@/components/ui'
const Q = [
  { c: 'Distribuidora Norte', doc: 'CNPJ', tipo: 'KYB', st: 'Em análise', tone: 'warn' as const },
  { c: 'J. R. Nunes', doc: 'CPF', tipo: 'KYC', st: 'Documentos', tone: 'default' as const },
  { c: 'Tienda Sol', doc: 'RUC', tipo: 'KYB', st: 'Aprovado', tone: 'pos' as const },
]
export default function Kyc() {
  const cols: Column<typeof Q[number]>[] = [
    { key: 'c', header: 'Cliente', render: (r) => <b>{r.c}</b> },
    { key: 'tipo', header: 'Tipo', render: (r) => <Chip>{r.tipo}</Chip> },
    { key: 'doc', header: 'Documento', mono: true },
    { key: 'st', header: 'Status', render: (r) => <Chip tone={r.tone}>{r.st}</Chip> },
    { key: 'a', header: '', align: 'right', render: () => <Soon label="Revisar" note="Fluxo de análise KYC/KYB — será ligado ao CompliancePort nesta fase." /> },
  ]
  return (
    <div>
      <PageHeader title="KYC Onboarding" subtitle="Verificação de identidade (KYC) e de empresas (KYB) no onboarding" action={<Soon label="Nova verificação" note="Início de verificação — provedor plugável por país (CompliancePort)." />} />
      <StatGrid cols={4}>
        <Stat label="Na fila" value="3" tone="warn" /><Stat label="Aprovados (30d)" value="1.204" tone="pos" />
        <Stat label="Pendentes" value="38" tone="muted" /><Stat label="Tempo médio" value="4h" tone="muted" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}><SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Fila de onboarding</SectionTitle><DataTable columns={cols} rows={Q} /></Card>
    </div>
  )
}
