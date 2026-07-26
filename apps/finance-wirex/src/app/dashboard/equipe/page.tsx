'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Tabs, DataTable, Column, Soon } from '@/components/ui'
const USERS = [
  { email: 'dono@aurora.com', papel: 'Titular', kyc: 'Aprovado', tone: 'pos' as const },
  { email: 'financeiro@aurora.com', papel: 'Financeiro', kyc: 'Aprovado', tone: 'pos' as const },
  { email: 'novo@aurora.com', papel: 'Operador', kyc: 'Pendente', tone: 'warn' as const },
]
const DEV = [
  { nome: 'Terminal Loja Centro', tipo: 'Terminal de cobrança', st: 'Ativo', tone: 'pos' as const },
  { nome: 'Vendedor — João', tipo: 'Seller (app)', st: 'Ativo', tone: 'pos' as const },
  { nome: 'Terminal Filial Sul', tipo: 'Terminal de cobrança', st: 'Aguardando', tone: 'warn' as const },
]
export default function Equipe() {
  const [tab, setTab] = useState('usuarios')
  return (
    <div>
      <PageHeader title="Equipe & Dispositivos" subtitle="Convide usuários (passam por KYC) e autorize terminais de cobrança e vendedores" />
      <StatGrid cols={3}>
        <Stat label="Usuários" value="3" tone="muted" /><Stat label="Terminais/sellers" value="3" tone="muted" /><Stat label="Pendências" value="2" tone="warn" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} tabs={[{ key: 'usuarios', label: 'Usuários & convites' }, { key: 'dispositivos', label: 'Dispositivos & terminais' }]} />
        {tab === 'usuarios' && (
          <div>
            <SectionTitle badge={<Soon label="Convidar usuário" note="Convite de usuário para sua conta (o convidado passa por KYC) — será ligado à API nesta fase." />}>Usuários da conta</SectionTitle>
            <DataTable rows={USERS} columns={[
              { key: 'email', header: 'E-mail', mono: true },
              { key: 'papel', header: 'Papel', render: (r) => <Chip>{r.papel}</Chip> },
              { key: 'kyc', header: 'KYC', render: (r) => <Chip tone={r.tone}>{r.kyc}</Chip> },
            ] as Column<typeof USERS[number]>[]} />
          </div>
        )}
        {tab === 'dispositivos' && (
          <div>
            <SectionTitle badge={<Soon label="Autorizar dispositivo" note="Autorização de terminal de cobrança / seller — será ligada ao módulo de dispositivos nesta fase." />}>Terminais e vendedores</SectionTitle>
            <DataTable rows={DEV} columns={[
              { key: 'nome', header: 'Dispositivo', render: (r) => <b>{r.nome}</b> },
              { key: 'tipo', header: 'Tipo' },
              { key: 'st', header: 'Status', render: (r) => <Chip tone={r.tone}>{r.st}</Chip> },
            ] as Column<typeof DEV[number]>[]} />
          </div>
        )}
      </Card>
    </div>
  )
}
