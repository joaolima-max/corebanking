'use client'

import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip } from '@/components/ui'
import { useMe } from '@/lib/hooks'

export default function Developers() {
  const me = useMe()
  const perms = me.data?.permissions ?? []
  return (
    <div>
      <PageHeader title="Developers" subtitle="API-first · REST v1 · Webhooks · Idempotência · escopo do seu tenant" action={<button className="btn primary">Criar API key</button>} />
      <StatGrid cols={3}>
        <Stat label="Base URL" value={<span className="num" style={{ fontSize: 14 }}>/api/v1</span>} sub="REST + OpenAPI" tone="muted" />
        <Stat label="Autenticação" value="JWT RS256" sub="+ API keys" tone="muted" />
        <Stat label="Rate limit" value="100 rps" sub="por tenant" tone="muted" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <SectionTitle badge={<Chip tone="acc">ao vivo /auth/me</Chip>}>Permissões da sua sessão</SectionTitle>
        {me.isLoading && <div style={{ color: 'var(--text-3)' }}>Carregando…</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {perms.length === 0 && !me.isLoading && <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Sem permissões específicas.</span>}
          {perms.map((p) => (
            <span key={p} className="num" style={{ fontSize: 11, color: 'var(--text-2)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', borderRadius: 6, padding: '3px 7px' }}>{p}</span>
          ))}
        </div>
      </Card>
      <Card style={{ marginTop: 14 }}>
        <SectionTitle>Endpoints principais</SectionTitle>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-2)', fontSize: 13, lineHeight: 1.9 }}>
          <li><span className="num">POST /api/v1/auth/login</span> — autenticação</li>
          <li><span className="num">GET /api/v1/pix/keys</span> · <span className="num">POST /api/v1/pix/transfers</span> — pagamento instantâneo</li>
          <li><span className="num">GET /api/v1/ledger/journal-entries</span> — extrato / ledger</li>
          <li><span className="num">GET /api/v1/accounts</span> — contas &amp; saldos</li>
        </ul>
      </Card>
    </div>
  )
}
