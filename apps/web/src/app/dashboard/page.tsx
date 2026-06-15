'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/format'
import MetricCard from '@/components/ui/MetricCard'
import { DollarSign, Building2, Users, Activity, TrendingUp, Wallet, PiggyBank, ArrowUpDown } from 'lucide-react'

interface ExecutiveMetrics {
  balances: {
    custodied: string
    operational: string
    reserve: string
    settlement: string
    blocked: string
    total: string
  }
  counts: {
    accounts: number
    organizations: number
    users: number
    transactions: number
    activeUsers: number
    blockedUsers: number
  }
  revenue: {
    accumulated: string
    monthly: string
    daily: string
  }
  financialVolume: string
  currency: string
}

export default function ExecutiveDashboard() {
  const { token } = useAuth()
  const [data, setData] = useState<ExecutiveMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setLoading(false); return }
    api.get<ExecutiveMetrics>('/api/v1/dashboard/executive', token)
      .then(setData)
      .catch(() => setError('Erro ao carregar métricas'))
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard Executivo</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão geral da plataforma Bass Financial Core</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      {/* Balances */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Posição de Saldos</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Saldo Custodiado"
            value={data ? formatCurrency(data.balances.custodied) : '—'}
            subtitle="Contas CLIENT + ESCROW"
            icon={<Wallet size={18} className="text-bass-500" />}
            loading={loading}
            size="md"
          />
          <MetricCard
            title="Saldo Operacional"
            value={data ? formatCurrency(data.balances.operational) : '—'}
            subtitle="Contas OPERATIONAL"
            icon={<DollarSign size={18} className="text-blue-500" />}
            loading={loading}
          />
          <MetricCard
            title="Saldo Reservado"
            value={data ? formatCurrency(data.balances.reserve) : '—'}
            subtitle="Contas RESERVE"
            icon={<PiggyBank size={18} className="text-purple-500" />}
            loading={loading}
          />
          <MetricCard
            title="Saldo em Liquidação"
            value={data ? formatCurrency(data.balances.settlement) : '—'}
            subtitle="Contas SETTLEMENT"
            icon={<ArrowUpDown size={18} className="text-amber-500" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Counts */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Métricas Operacionais</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Contas"
            value={data ? formatNumber(data.counts.accounts) : '—'}
            subtitle="Contas ativas"
            icon={<Wallet size={18} className="text-slate-500" />}
            loading={loading}
          />
          <MetricCard
            title="Organizações"
            value={data ? formatNumber(data.counts.organizations) : '—'}
            subtitle="Orgs ativas"
            icon={<Building2 size={18} className="text-slate-500" />}
            loading={loading}
          />
          <MetricCard
            title="Usuários"
            value={data ? formatNumber(data.counts.users) : '—'}
            subtitle={data ? `${data.counts.activeUsers} ativos · ${data.counts.blockedUsers} bloqueados` : ''}
            icon={<Users size={18} className="text-slate-500" />}
            loading={loading}
          />
          <MetricCard
            title="Transações"
            value={data ? formatNumber(data.counts.transactions) : '—'}
            subtitle="Journal entries postados"
            icon={<Activity size={18} className="text-slate-500" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Revenue + Volume */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Receita & Volume</h2>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Volume Financeiro"
            value={data ? formatCurrency(data.financialVolume) : '—'}
            subtitle="Total processado (débitos)"
            icon={<TrendingUp size={18} className="text-bass-500" />}
            variant="success"
            loading={loading}
            size="md"
          />
          <MetricCard
            title="Receita Acumulada"
            value={data ? formatCurrency(data.revenue.accumulated) : '—'}
            subtitle="Contas REVENUE (créditos)"
            loading={loading}
          />
          <MetricCard
            title="Receita Mensal"
            value={data ? formatCurrency(data.revenue.monthly) : '—'}
            subtitle="Mês corrente"
            loading={loading}
          />
          <MetricCard
            title="Receita Diária"
            value={data ? formatCurrency(data.revenue.daily) : '—'}
            subtitle="Hoje"
            loading={loading}
          />
        </div>
      </div>

      {/* Total summary */}
      {data && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Saldo Total Consolidado (todas as contas)</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{formatCurrency(data.balances.total)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Saldo Bloqueado</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(data.balances.blocked)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
