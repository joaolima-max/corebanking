'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatCurrency, formatNumber } from '@/lib/format'
import MetricCard from '@/components/ui/MetricCard'
import { CheckCircle, AlertTriangle, BookOpen, TrendingUp, TrendingDown, MinusCircle } from 'lucide-react'

interface LedgerMetrics {
  totals: {
    debits: string
    credits: string
    balance: string
    divergence: string
    isBalanced: boolean
  }
  accounts: { total: number; active: number; inactive: number }
  operationalAccounts: { total: number; active: number; blocked: number; closed: number }
  alerts: { outOfBalance: boolean; divergenceAmount: string }
}

export default function LedgerPage() {
  const { token } = useAuth()
  const [data, setData] = useState<LedgerMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<LedgerMetrics>('/api/v1/dashboard/ledger', token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Ledger Contábil</h1>
        <p className="text-slate-500 text-sm mt-0.5">Balancete e invariantes de dupla entrada</p>
      </div>

      {/* Balance Alert */}
      {!loading && data && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          data.totals.isBalanced
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {data.totals.isBalanced ? (
            <CheckCircle size={20} className="text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-sm">
              {data.totals.isBalanced ? 'Ledger Balanceado' : 'ALERTA: Ledger Fora de Balanço'}
            </p>
            <p className="text-xs mt-0.5">
              {data.totals.isBalanced
                ? 'Todos os lançamentos estão balanceados — Σ DEBIT = Σ CREDIT'
                : `Divergência detectada: ${formatCurrency(data.alerts.divergenceAmount)}`}
            </p>
          </div>
        </div>
      )}

      {/* Totals */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Totais Contábeis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Total Débitos"
            value={data ? formatCurrency(data.totals.debits) : '—'}
            icon={<TrendingDown size={18} className="text-red-400" />}
            loading={loading}
            size="lg"
          />
          <MetricCard
            title="Total Créditos"
            value={data ? formatCurrency(data.totals.credits) : '—'}
            icon={<TrendingUp size={18} className="text-emerald-500" />}
            loading={loading}
            size="lg"
          />
          <MetricCard
            title="Saldo Consolidado"
            value={data ? formatCurrency(data.totals.balance) : '—'}
            subtitle="Deve ser R$ 0,00"
            icon={<MinusCircle size={18} className="text-slate-400" />}
            variant={data?.totals.isBalanced ? 'success' : 'danger'}
            loading={loading}
            size="lg"
          />
        </div>
      </div>

      {/* Divergence */}
      {data && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Divergência Contábil</p>
            <p className="text-xs text-slate-500 mt-0.5">|Σ Débitos − Σ Créditos|</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${data.totals.isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(data.totals.divergence)}
            </p>
            <p className={`text-xs mt-0.5 ${data.totals.isBalanced ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.totals.isBalanced ? '✓ Zero divergência' : '⚠ Investigar imediatamente'}
            </p>
          </div>
        </div>
      )}

      {/* Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contas Contábeis (Chart of Accounts)</h2>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard title="Total" value={data ? formatNumber(data.accounts.total) : '—'} loading={loading} size="sm" />
            <MetricCard title="Ativas" value={data ? formatNumber(data.accounts.active) : '—'} variant="success" loading={loading} size="sm" />
            <MetricCard title="Inativas" value={data ? formatNumber(data.accounts.inactive) : '—'} loading={loading} size="sm" />
          </div>
        </div>
        <div>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contas Operacionais</h2>
          <div className="grid grid-cols-4 gap-3">
            <MetricCard title="Total" value={data ? formatNumber(data.operationalAccounts.total) : '—'} loading={loading} size="sm" />
            <MetricCard title="Ativas" value={data ? formatNumber(data.operationalAccounts.active) : '—'} variant="success" loading={loading} size="sm" />
            <MetricCard title="Bloqueadas" value={data ? formatNumber(data.operationalAccounts.blocked) : '—'} variant={data?.operationalAccounts.blocked ? 'danger' : 'default'} loading={loading} size="sm" />
            <MetricCard title="Fechadas" value={data ? formatNumber(data.operationalAccounts.closed) : '—'} loading={loading} size="sm" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={16} className="text-slate-500" />
          <p className="text-sm font-medium text-slate-700">Sobre o Ledger</p>
        </div>
        <p className="text-xs text-slate-500">
          O ledger contábil segue o princípio de dupla entrada (GAAP): para cada débito existe um crédito equivalente.
          A divergência deve ser sempre R$ 0,00. Qualquer valor diferente indica inconsistência transacional.
        </p>
      </div>
    </div>
  )
}
