'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface Client {
  id: string
  slug: string
  name: string
  type: string
  status: string
  settings?: { country?: string; currency?: string }
  createdAt: string
}

const TYPE_LABEL: Record<string, string> = {
  BASS: 'Plataforma',
  WHITE_LABEL: 'White Label',
  COMPANY: 'Empresa',
  MERCHANT: 'Merchant',
}

export default function AdminOverview() {
  const { token } = useAuth()

  const clients = useQuery({
    queryKey: ['admin-clients'],
    queryFn: () => api.get<Client[]>('/api/v1/admin/clients', token!),
    enabled: !!token,
  })

  const total = clients.data?.length ?? 0
  const active = clients.data?.filter((c) => c.status === 'ACTIVE').length ?? 0
  const whiteLabels = clients.data?.filter((c) => c.type === 'WHITE_LABEL').length ?? 0

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 21, margin: '0 0 3px', letterSpacing: '-0.025em' }}>Visão global</h1>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13 }}>Gestão de todos os clientes · dados ao vivo de <span className="num">/api/v1/admin/clients</span></p>
        </div>
        <button className="btn primary">＋ Provisionar cliente</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        <Kpi label="Clientes (total)" value={String(total)} />
        <Kpi label="Ativos" value={String(active)} />
        <Kpi label="White-labels" value={String(whiteLabels)} />
        <Kpi label="Gateway" value="99,98%" sub="● operacional" />
      </div>

      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>
          Clientes (tenants) <span className="chip acc" style={{ marginLeft: 6 }}>escopo GLOBAL</span>
        </h3>
        {clients.isLoading && <p style={{ color: 'var(--text-3)' }}>Carregando…</p>}
        {clients.isError && <p style={{ color: 'var(--neg)' }}>Falha ao carregar clientes (requer escopo GLOBAL).</p>}
        {clients.data && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  {['Cliente', 'Tipo', 'País', 'Moeda', 'Status', 'Criado'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', padding: '0 12px 10px', borderBottom: '1px solid var(--border-soft)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.data.map((c) => (
                  <tr key={c.id}>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className="num" style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.slug}</div>
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)' }}>{TYPE_LABEL[c.type] ?? c.type}</td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)' }}>{c.settings?.country ?? '—'}</td>
                    <td className="num" style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)' }}>{c.settings?.currency ?? '—'}</td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)' }}>
                      <span className="chip pos">{c.status}</span>
                    </td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-3)' }}>{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: '15px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</div>
      <div className="num" style={{ fontSize: 23, fontWeight: 650, margin: '8px 0 5px', letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--accent)' }}>{sub}</div>}
    </div>
  )
}
