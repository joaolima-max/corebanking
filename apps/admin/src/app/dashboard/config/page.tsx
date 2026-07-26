'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, Field, Chip, Tabs, DataTable, Column, Soon } from '@/components/ui'
import { useMe } from '@/lib/hooks'
const PERMS = [
  { papel: 'SUPER_ADMIN', escopo: 'GLOBAL', desc: 'Acesso total' },
  { papel: 'COMPLIANCE', escopo: 'ORGANIZATION', desc: 'KYC, PLD, risco' },
  { papel: 'TREASURY', escopo: 'ORGANIZATION', desc: 'Financeiro e tesouraria' },
  { papel: 'OPERATIONS', escopo: 'ORGANIZATION', desc: 'Operação e monitoramento' },
]
export default function Config() {
  const me = useMe(); const [tab, setTab] = useState('perfil')
  return (
    <div>
      <PageHeader title="Configurações" subtitle="Perfil, segurança da conta e permissões de usuários" />
      <Card>
        <Tabs active={tab} onChange={setTab} tabs={[{ key: 'perfil', label: 'Perfil' }, { key: 'conta', label: 'Conta & 2FA' }, { key: 'perms', label: 'Permissões' }]} />
        {tab === 'perfil' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Field k="Nome" v={me.data?.fullName ?? '—'} /><Field k="E-mail" v={me.data?.email ?? '—'} />
            <Field k="Papéis" v={me.data?.roles?.join(', ') ?? '—'} />
          </div>
        )}
        {tab === 'conta' && (
          <div style={{ maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><SectionTitle>Trocar e-mail</SectionTitle><input className="input" placeholder="novo@email.com" style={{ marginBottom: 8 }} /><Soon label="Atualizar e-mail" note="Troca de e-mail com verificação — será ligada nesta fase." /></div>
            <div><SectionTitle>Trocar senha</SectionTitle><input className="input" type="password" placeholder="nova senha" style={{ marginBottom: 8 }} /><Soon label="Atualizar senha" /></div>
            <div><SectionTitle>Telefone</SectionTitle><input className="input" placeholder="+55 11 9...." style={{ marginBottom: 8 }} /><Soon label="Atualizar telefone" /></div>
            <div><SectionTitle>Autenticação em 2 fatores (2FA)</SectionTitle><div style={{ marginBottom: 8 }}><Chip tone="pos">TOTP ativo</Chip></div><Soon label="Reconfigurar 2FA" note="Enrolamento TOTP — o backend já tem MFA (auth/mfa); será ligado à UI nesta fase." /></div>
          </div>
        )}
        {tab === 'perms' && (
          <div>
            <SectionTitle badge={<Soon label="Editar permissões" note="Ajuste de permissões por papel — será ligado a /roles + /permissions nesta fase." />}>Papéis e permissões</SectionTitle>
            <DataTable rows={PERMS} columns={[
              { key: 'papel', header: 'Papel', render: (r) => <b>{r.papel}</b> },
              { key: 'escopo', header: 'Escopo', render: (r) => <Chip tone={r.escopo === 'GLOBAL' ? 'acc' : 'default'}>{r.escopo}</Chip> },
              { key: 'desc', header: 'Descrição', render: (r) => <span style={{ color: 'var(--text-3)' }}>{r.desc}</span> },
            ] as Column<typeof PERMS[number]>[]} />
          </div>
        )}
      </Card>
    </div>
  )
}
