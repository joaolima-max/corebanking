'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatNumber } from '@/lib/format'
import MetricCard from '@/components/ui/MetricCard'
import { Shield, AlertTriangle, Lock, UserX, Clock } from 'lucide-react'

interface RiskMetrics {
  prepared: true
  accounts: { blocked: number; underReview: number }
  users: { blocked: number; pendingMfa: number }
  compliance: { alerts: number; pendingReview: number }
  recentBlockEvents: Array<{
    id: string
    action: string
    resourceType: string
    createdAt: string
  }>
}

export default function RiskPage() {
  const { token } = useAuth()
  const [data, setData] = useState<RiskMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<RiskMetrics>('/api/v1/dashboard/risk', token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">Gestão de Risco</h1>
            <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">Preparado</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Monitoramento de contas bloqueadas e eventos de segurança</p>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <Shield size={16} className="text-purple-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-purple-800">Motor de Risco em Desenvolvimento — Fase 5</p>
          <p className="text-xs text-purple-600 mt-1">
            Dados reais de contas/usuários bloqueados já disponíveis. Score de risco, regras PLD e integração COAF serão adicionados na Fase 5.
          </p>
        </div>
      </div>

      {/* Accounts */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contas</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Contas Bloqueadas"
            value={data ? formatNumber(data.accounts.blocked) : '—'}
            icon={<Lock size={18} className="text-red-500" />}
            variant={data?.accounts.blocked ? 'danger' : 'default'}
            loading={loading}
          />
          <MetricCard
            title="Sob Revisão"
            value={data ? formatNumber(data.accounts.underReview) : '—'}
            subtitle="Fase 5"
            prepared
            loading={loading}
          />
          <MetricCard
            title="Usuários Bloqueados"
            value={data ? formatNumber(data.users.blocked) : '—'}
            icon={<UserX size={18} className="text-red-400" />}
            variant={data?.users.blocked ? 'warning' : 'default'}
            loading={loading}
          />
          <MetricCard
            title="Aguardando MFA"
            value={data ? formatNumber(data.users.pendingMfa) : '—'}
            icon={<Clock size={18} className="text-amber-500" />}
            variant={data?.users.pendingMfa ? 'warning' : 'default'}
            loading={loading}
          />
        </div>
      </div>

      {/* Compliance */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Compliance</h2>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Alertas de Compliance"
            value={data ? formatNumber(data.compliance.alerts) : '—'}
            subtitle="PLD/COAF — Fase 5"
            icon={<AlertTriangle size={18} className="text-amber-500" />}
            prepared
            loading={loading}
          />
          <MetricCard
            title="Pendentes de Revisão"
            value={data ? formatNumber(data.compliance.pendingReview) : '—'}
            subtitle="KYC/KYB — Fase 5"
            prepared
            loading={loading}
          />
        </div>
      </div>

      {/* Recent block events */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Eventos Recentes de Bloqueio</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 animate-pulse bg-slate-100 rounded" />
            ))}
          </div>
        ) : data?.recentBlockEvents.length ? (
          <div className="space-y-2">
            {data.recentBlockEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${event.action.includes('BLOCK') ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <span className="text-sm text-slate-700">{event.action.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-slate-400">{event.resourceType}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(event.createdAt).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">Nenhum evento de bloqueio recente</p>
        )}
      </div>
    </div>
  )
}
