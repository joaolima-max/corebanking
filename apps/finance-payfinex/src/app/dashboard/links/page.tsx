'use client'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, DataTable, Column, Soon } from '@/components/ui'
const LINKS = [
  { nome: 'Assinatura mensal', valor: 'R$ 49,90', usos: '128', st: 'Ativo', tone: 'pos' as const },
  { nome: 'Cobrança avulsa', valor: 'Aberto', usos: '412', st: 'Ativo', tone: 'pos' as const },
  { nome: 'Campanha julho', valor: 'R$ 120,00', usos: '37', st: 'Expirado', tone: 'default' as const },
]
export default function Links() {
  const cols: Column<typeof LINKS[number]>[] = [
    { key: 'nome', header: 'Link', render: (r) => <b>{r.nome}</b> },
    { key: 'valor', header: 'Valor', mono: true },
    { key: 'usos', header: 'Pagamentos', mono: true, align: 'right' },
    { key: 'st', header: 'Status', render: (r) => <Chip tone={r.tone}>{r.st}</Chip> },
    { key: 'x', header: '', align: 'right', render: () => <Soon label="Copiar link" note="Geração/compartilhamento de link de pagamento — será ligada a /pix/qr-codes nesta fase." /> },
  ]
  return (
    <div>
      <PageHeader title="Links de pagamento" subtitle="Cobre por link · PIX instantâneo · valor fixo ou aberto" action={<Soon label="＋ Criar link" note="Criação de link de pagamento — será ligada à API nesta fase." />} />
      <StatGrid cols={3}>
        <Stat label="Links ativos" value="2" tone="pos" /><Stat label="Pagamentos (30d)" value="577" tone="muted" /><Stat label="Conversão" value="97,8%" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}><SectionTitle badge={<Chip tone="acc">estrutura</Chip>}>Seus links</SectionTitle><DataTable columns={cols} rows={LINKS} /></Card>
    </div>
  )
}
