'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Tabs, DataTable, Column, Soon } from '@/components/ui'
const DEV = [
  { disp: 'Chrome · Windows', usuario: 'operador@bass', ip: '187.**.**.10', local: 'São Paulo/BR', st: 'Pendente', tone: 'warn' as const },
  { disp: 'App iOS', usuario: 'financeiro@bass', ip: '201.**.**.7', local: 'Assunção/PY', st: 'Pendente', tone: 'warn' as const },
  { disp: 'Chrome · macOS', usuario: 'admin@bass', ip: '189.**.**.3', local: 'São Paulo/BR', st: 'Aprovado', tone: 'pos' as const },
]
const CONV = [
  { email: 'compliance@bass.com', papel: 'Compliance', kyc: 'Aprovado', tone: 'pos' as const },
  { email: 'novo.operador@bass.com', papel: 'Operações', kyc: 'Pendente', tone: 'warn' as const },
]
export default function Seguranca() {
  const [tab, setTab] = useState('dispositivos')
  return (
    <div>
      <PageHeader title="Segurança" subtitle="Aprovação manual de novos dispositivos e gestão de acesso multiusuário" />
      <StatGrid cols={4}>
        <Stat label="Dispositivos pendentes" value="2" tone="warn" />
        <Stat label="Dispositivos ativos" value="14" tone="muted" />
        <Stat label="Usuários (multi-acesso)" value="6" tone="muted" />
        <Stat label="2FA obrigatório" value="Sim" tone="pos" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} tabs={[{ key: 'dispositivos', label: 'Dispositivos pendentes' }, { key: 'acesso', label: 'Multi-acesso & convites' }]} />
        {tab === 'dispositivos' && (
          <DataTable rows={DEV} columns={[
            { key: 'disp', header: 'Dispositivo', render: (r) => <b>{r.disp}</b> },
            { key: 'usuario', header: 'Usuário', mono: true },
            { key: 'ip', header: 'IP', mono: true }, { key: 'local', header: 'Local' },
            { key: 'st', header: 'Status', render: (r) => <Chip tone={r.tone}>{r.st}</Chip> },
            { key: 'x', header: '', align: 'right', render: (r) => r.st === 'Pendente' ? <Soon label="Aprovar dispositivo" note="Aprovação manual de vínculo de dispositivo — será ligada ao módulo de segurança nesta fase." /> : <span /> },
          ] as Column<typeof DEV[number]>[]} />
        )}
        {tab === 'acesso' && (
          <div>
            <SectionTitle badge={<Soon label="Convidar usuário" note="Convite de usuário (deve passar por KYC antes de acessar) — será ligado a /users + KYC nesta fase." />}>Usuários da conta (cada convidado passa por KYC)</SectionTitle>
            <DataTable rows={CONV} columns={[
              { key: 'email', header: 'E-mail', mono: true },
              { key: 'papel', header: 'Papel', render: (r) => <Chip>{r.papel}</Chip> },
              { key: 'kyc', header: 'KYC', render: (r) => <Chip tone={r.tone}>{r.kyc}</Chip> },
            ] as Column<typeof CONV[number]>[]} />
          </div>
        )}
      </Card>
    </div>
  )
}
