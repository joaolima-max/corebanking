'use client'

import { PageHeader, Card, SectionTitle, Chip } from '@/components/ui'
import { useMe } from '@/lib/hooks'

function Field({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{k}</div>
      <div className={mono ? 'num' : undefined} style={{ fontSize: 13, marginTop: 3 }}>{v}</div>
    </div>
  )
}

export default function Conta() {
  const me = useMe()
  const d = me.data
  return (
    <div>
      <PageHeader title="Minha conta" subtitle="Perfil e identidade do titular · dados ao vivo da API" />
      <Card>
        <SectionTitle badge={<Chip tone="acc">ao vivo /auth/me</Chip>}>Perfil</SectionTitle>
        {me.isLoading && <div style={{ color: 'var(--text-3)' }}>Carregando…</div>}
        {me.isError && <div style={{ color: 'var(--neg)' }}>Falha ao carregar o perfil.</div>}
        {d && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field k="Titular" v={d.fullName} />
            <Field k="E-mail" v={d.email} />
            <Field k="Tenant (orgId)" v={d.orgId} mono />
            <Field k="Papéis" v={d.roles?.join(', ') || '—'} />
            <Field k="Status" v={d.status ?? 'ACTIVE'} />
          </div>
        )}
      </Card>
    </div>
  )
}
