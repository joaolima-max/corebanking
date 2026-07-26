'use client'
import { useState } from 'react'
import { PageHeader, Card, SectionTitle, StatGrid, Stat, Chip, Tabs, DataTable, Column, Soon } from '@/components/ui'
const LOGS = [
  { canal: 'SMS', prov: 'Twilio', dest: '+55 11 9****-1234', ass: 'Código de acesso', st: 'Falha', tone: 'neg' as const },
  { canal: 'E-mail', prov: 'SES', dest: 'j****@empresa.com', ass: 'Recibo de pagamento', st: 'Entregue', tone: 'pos' as const },
  { canal: 'SMS', prov: 'Twilio', dest: '+595 9**-****', ass: 'Alerta de saque', st: 'Entregue', tone: 'pos' as const },
  { canal: 'E-mail', prov: 'SES', dest: 'contato@****', ass: 'Convite de acesso', st: 'Bounce', tone: 'warn' as const },
]
export default function Notificacoes() {
  const [tab, setTab] = useState('entregas')
  const [msg, setMsg] = useState('')
  const cols: Column<typeof LOGS[number]>[] = [
    { key: 'canal', header: 'Canal', render: (r) => <Chip>{r.canal}</Chip> },
    { key: 'prov', header: 'Provedor' },
    { key: 'dest', header: 'Destino', mono: true },
    { key: 'ass', header: 'Assunto' },
    { key: 'st', header: 'Status', render: (r) => <Chip tone={r.tone}>{r.st}</Chip> },
    { key: 'x', header: '', align: 'right', render: (r) => r.st !== 'Entregue' ? <Soon label="Reenviar" note="Reenvio da notificação via provedor (Twilio/SES) — será ligado nesta fase." /> : <span /> },
  ]
  return (
    <div>
      <PageHeader title="Notificações" subtitle="Entregas de SMS/e-mail pelos provedores (falhas do Twilio etc.) e comunicados gerais" />
      <StatGrid cols={4}>
        <Stat label="Enviadas (24h)" value="8.412" tone="muted" />
        <Stat label="Falhas SMS" value="21" tone="neg" />
        <Stat label="Bounces e-mail" value="7" tone="warn" />
        <Stat label="Taxa de entrega" value="99,7%" tone="pos" />
      </StatGrid>
      <Card style={{ marginTop: 14 }}>
        <Tabs active={tab} onChange={setTab} tabs={[{ key: 'entregas', label: 'Entregas do provedor' }, { key: 'broadcast', label: 'Comunicado geral' }]} />
        {tab === 'entregas' && <DataTable rows={LOGS} columns={cols} />}
        {tab === 'broadcast' && (
          <div style={{ maxWidth: 560 }}>
            <SectionTitle badge={<Chip tone="acc">todos os usuários</Chip>}>Enviar mensagem geral</SectionTitle>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Canais</div>
            <div style={{ display: 'flex', gap: 14, marginBottom: 12, fontSize: 13 }}>
              <label><input type="checkbox" defaultChecked /> In-app</label>
              <label><input type="checkbox" /> E-mail</label>
              <label><input type="checkbox" /> SMS</label>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 5 }}>Mensagem</div>
            <textarea className="input" rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ex.: Manutenção programada dia 30/07 das 02h às 04h." style={{ marginBottom: 16, resize: 'vertical' }} />
            <Soon label="Enviar para todos" note="Broadcast para todos os usuários — será ligado ao serviço de notificações nesta fase." />
          </div>
        )}
      </Card>
    </div>
  )
}
