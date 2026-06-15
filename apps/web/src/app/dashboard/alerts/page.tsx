'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { AlertTriangle, AlertCircle, Info, CheckCircle, RefreshCw } from 'lucide-react'

interface Alert {
  id: string
  level: 'critical' | 'warning' | 'info'
  title: string
  description: string
  category: string
  createdAt: string
  resolvedAt?: string
}

interface AlertsMetrics {
  summary: { critical: number; warning: number; info: number; total: number }
  alerts: Alert[]
}

const levelConfig = {
  critical: { icon: AlertCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Crítico' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: 'Aviso' },
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', label: 'Info' },
}

function AlertItem({ alert }: { alert: Alert }) {
  const cfg = levelConfig[alert.level]
  const Icon = cfg.icon
  return (
    <div className={`flex gap-4 p-4 rounded-lg border ${cfg.bg} ${cfg.border}`}>
      <Icon size={18} className={`${cfg.text} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-semibold ${cfg.text}`}>{alert.title}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${cfg.badge}`}>{cfg.label}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{alert.category}</span>
        </div>
        <p className="text-xs text-slate-600 mt-1">{alert.description}</p>
        <p className="text-xs text-slate-400 mt-1">{new Date(alert.createdAt).toLocaleString('pt-BR')}</p>
      </div>
      {alert.resolvedAt && (
        <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
      )}
    </div>
  )
}

export default function AlertsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<AlertsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(() => {
    if (!token) return
    setRefreshing(true)
    api.get<AlertsMetrics>('/api/v1/dashboard/alerts', token)
      .then(setData)
      .catch(console.error)
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [token])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const critical = data?.alerts.filter(a => a.level === 'critical') ?? []
  const warning = data?.alerts.filter(a => a.level === 'warning') ?? []
  const info = data?.alerts.filter(a => a.level === 'info') ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Central de Alertas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Alertas críticos, avisos e informações da plataforma · atualiza a cada 30s</p>
        </div>
        <button
          onClick={fetchData}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-red-700">{loading ? '—' : (data?.summary.critical ?? 0)}</p>
            <p className="text-xs text-red-500 mt-0.5">Críticos</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-amber-700">{loading ? '—' : (data?.summary.warning ?? 0)}</p>
            <p className="text-xs text-amber-500 mt-0.5">Avisos</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Info size={20} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-2xl font-bold text-blue-700">{loading ? '—' : (data?.summary.info ?? 0)}</p>
            <p className="text-xs text-blue-500 mt-0.5">Informativos</p>
          </div>
        </div>
      </div>

      {/* Critical */}
      {(loading || critical.length > 0) && (
        <div>
          <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Críticos</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 animate-pulse bg-slate-100 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {critical.map(a => <AlertItem key={a.id} alert={a} />)}
            </div>
          )}
        </div>
      )}

      {/* Warning */}
      {(loading || warning.length > 0) && (
        <div>
          <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3">Avisos</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 animate-pulse bg-slate-100 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {warning.map(a => <AlertItem key={a.id} alert={a} />)}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      {(loading || info.length > 0) && (
        <div>
          <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">Informativos</h2>
          {loading ? (
            <div className="space-y-3">
              {[1].map(i => <div key={i} className="h-20 animate-pulse bg-slate-100 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {info.map(a => <AlertItem key={a.id} alert={a} />)}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && data?.summary.total === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
          <CheckCircle size={32} className="text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-emerald-700">Nenhum alerta ativo</p>
          <p className="text-xs text-emerald-500 mt-1">Todos os sistemas estão operando normalmente</p>
        </div>
      )}
    </div>
  )
}
