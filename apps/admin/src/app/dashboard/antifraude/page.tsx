'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, Soon } from '@/components/ui'
const DOCS = [
  { doc: 'RG frente (borrado)', motivo: 'Ilegível', cliente: 'J. Silva', tone: 'neg' as const },
  { doc: 'Comprovante endereço', motivo: 'Divergente', cliente: 'M. Souza', tone: 'warn' as const },
]
export default function Antifraude() {
  const cols: Column<typeof DOCS[number]>[] = [
    { key: 'doc', header: 'Documento', render: (r) => <b>{r.doc}</b> },
    { key: 'cliente', header: 'Cliente' },
    { key: 'motivo', header: 'Motivo da negativa', render: (r) => <Chip tone={r.tone}>{r.motivo}</Chip> },
    { key: 'x', header: '', align: 'right', render: () => <Soon label="Ver documento" note="Análise de documento suspeito — será ligada ao módulo antifraude nesta fase." /> },
  ]
  return (
    <div>
      <PageHeader title="Antifraude" subtitle="Documentos negados e gestão de casos de fraude" action={<Soon label="Adicionar documento negado" note="Registro de documento negado (base antifraude) — será ligado nesta fase." />} />
      <StatGrid cols={3}>
        <Stat label="Documentos negados" value="2" tone="neg" /><Stat label="Casos abertos" value="1" tone="warn" /><Stat label="Taxa de fraude" value="0,02%" tone="pos" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}><SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Documentos negados</SectionTitle><DataTable columns={cols} rows={DOCS} /></Card>
    </div>
  )
}
