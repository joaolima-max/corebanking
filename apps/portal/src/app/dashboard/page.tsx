'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

interface Me { id: string; email: string; fullName: string; orgId: string; roles: string[] }
interface LedgerAccount { id: string; code: string; name: string; type: string; currency: string }

export default function PortalOverview() {
  const { token } = useAuth()

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<Me>('/api/v1/auth/me', token!),
    enabled: !!token,
  })

  const accounts = useQuery({
    queryKey: ['ledger-accounts', me.data?.orgId],
    queryFn: () => api.get<LedgerAccount[]>(`/api/v1/ledger/accounts?orgId=${me.data!.orgId}`, token!),
    enabled: !!token && !!me.data?.orgId,
  })

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 21, margin: '0 0 3px', letterSpacing: '-0.025em' }}>Início</h1>
          <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13 }}>Pagamentos instantâneos · liquidação em tempo real · dados ao vivo da API</p>
        </div>
        <button className="btn primary">＋ Nova cobrança PIX</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        <Kpi label="Saldo disponível" value="R$ 284.502,90" sub="⚡ instantâneo" />
        <Kpi label="Recebido hoje" value="R$ 41,23k" sub="+ 9% vs. ontem" />
        <Kpi label="Contas contábeis" value={accounts.data ? String(accounts.data.length) : '—'} sub="do seu tenant" />
      </div>

      {/* Identity from API */}
      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Sua conta <span className="chip acc" style={{ marginLeft: 6 }}>ao vivo /api/v1/auth/me</span></h3>
        {me.isLoading && <p style={{ color: 'var(--text-3)' }}>Carregando…</p>}
        {me.isError && <p style={{ color: 'var(--neg)' }}>Falha ao carregar a conta.</p>}
        {me.data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            <Field k="Titular" v={me.data.fullName} />
            <Field k="E-mail" v={me.data.email} />
            <Field k="Tenant (orgId)" v={me.data.orgId} mono />
            <Field k="Papéis" v={me.data.roles?.join(', ') || '—'} />
          </div>
        )}
      </div>

      {/* Ledger accounts (real) */}
      <div className="card" style={{ padding: 18, marginTop: 14 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14 }}>Plano de contas · extrato <span className="chip acc" style={{ marginLeft: 6 }}>ao vivo /api/v1/ledger/accounts</span></h3>
        {accounts.isLoading && <p style={{ color: 'var(--text-3)' }}>Carregando…</p>}
        {accounts.data && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr>
                  {['Código', 'Conta', 'Tipo', 'Moeda'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', padding: '0 12px 10px', borderBottom: '1px solid var(--border-soft)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.data.map((a) => (
                  <tr key={a.id}>
                    <td className="num" style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)', color: 'var(--text-2)' }}>{a.code}</td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)' }}>{a.name}</td>
                    <td style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)' }}><span className="chip">{a.type}</span></td>
                    <td className="num" style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)' }}>{a.currency}</td>
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

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card" style={{ padding: '15px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</div>
      <div className="num" style={{ fontSize: 22, fontWeight: 650, margin: '8px 0 5px', letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--accent)' }}>{sub}</div>
    </div>
  )
}

function Field({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{k}</div>
      <div className={mono ? 'num' : undefined} style={{ fontSize: 13, marginTop: 3 }}>{v}</div>
    </div>
  )
}
