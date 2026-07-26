'use client'
import { useState } from 'react'
import { PageHeader, Card, Tabs, SectionTitle, Field, Chip, Soon } from '@/components/ui'
import { useMe } from '@/lib/hooks'
export default function Config() {
  const me = useMe(); const [tab, setTab] = useState('perfil')
  return (
    <div>
      <PageHeader title="Configurações" subtitle="Preferências da conta, branding, tarifas e webhooks" />
      <Card>
        <Tabs active={tab} onChange={setTab} tabs={[
          { key: 'perfil', label: 'Perfil' }, { key: 'branding', label: 'Branding' },
          { key: 'tarifas', label: 'Tarifas' }, { key: 'webhooks', label: 'Webhooks' },
        ]} />
        {tab === 'perfil' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field k="Titular" v={me.data?.fullName ?? '—'} /><Field k="E-mail" v={me.data?.email ?? '—'} />
            <Field k="Tenant" v={me.data?.orgId ?? '—'} mono />
          </div>
        )}
        {tab === 'branding' && (
          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Nome de exibição</div>
            <input className="input" defaultValue="Aurora Pay" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Cor de destaque</div>
            <input className="input" defaultValue="#31D0AA" style={{ marginBottom: 16 }} />
            <Soon label="Salvar branding" note="Branding white-label por tenant — será persistido em TenantBranding nesta fase." />
          </div>
        )}
        {tab === 'tarifas' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field k="PIX in" v="0,79%" /><Field k="PIX out" v="0,99%" /><Field k="Spread FX" v="1,20%" />
          </div>
        )}
        {tab === 'webhooks' && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>URL do webhook</div>
            <input className="input" placeholder="https://seu-sistema.com/webhooks/bass" style={{ marginBottom: 16 }} />
            <Soon label="Salvar webhook" note="Configuração de webhook assinado (HMAC) — será ligada nesta fase." />
          </div>
        )}
      </Card>
    </div>
  )
}
