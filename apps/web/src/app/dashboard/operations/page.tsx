'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatNumber, formatPercent, formatCurrency } from '@/lib/format'
import MetricCard from '@/components/ui/MetricCard'
import AreaChartComponent from '@/components/charts/AreaChartComponent'
import BarChartComponent from '@/components/charts/BarChartComponent'
import { Activity, CheckCircle, XCircle, RotateCcw, Zap, Clock } from 'lucide-react'

interface OperationsMetrics {
  transactions: {
    today: number
    lastHour: number
    lastMinute: number
    total: number
    pending: number
    voided: number
    successRate: number
    failureRate: number
  }
  tps: { average: number; peak: number }
  volumeByHour: Array<{ hour: string; count: number; volume: string }>
  volumeByDay: Array<{ day: string; count: number; volume: string }>
  volumeByMonth: Array<{ month: string; count: number; volume: string }>
}

export default function OperationsPage() {
  const { token } = useAuth()
  const [data, setData] = useState<OperationsMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    if (!token) { setLoading(false); return }
    api.get<OperationsMetrics>('/api/v1/dashboard/operations', token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const hourlyData = data?.volumeByHour.map(d => ({
    label: new Date(d.hour).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    value: parseFloat(d.volume),
  })) ?? []

  const dailyData = data?.volumeByDay.map(d => ({
    label: new Date(d.day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    value: parseFloat(d.volume),
    volume: d.count,
  })) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Operações</h1>
          <p className="text-slate-500 text-sm mt-0.5">Indicadores operacionais em tempo real · atualiza a cada 30s</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-bass-600 bg-bass-50 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-bass-500 rounded-full animate-pulse" />
          Ao Vivo
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Transações Hoje"
          value={data ? formatNumber(data.transactions.today) : '—'}
          icon={<Activity size={18} className="text-bass-500" />}
          loading={loading}
        />
        <MetricCard
          title="Última Hora"
          value={data ? formatNumber(data.transactions.lastHour) : '—'}
          icon={<Clock size={18} className="text-blue-500" />}
          loading={loading}
        />
        <MetricCard
          title="TPS Médio"
          value={data ? data.tps.average.toFixed(3) : '—'}
          subtitle="transações/segundo"
          icon={<Zap size={18} className="text-amber-500" />}
          loading={loading}
        />
        <MetricCard
          title="Taxa de Sucesso"
          value={data ? formatPercent(data.transactions.successRate) : '—'}
          icon={<CheckCircle size={18} className="text-emerald-500" />}
          variant={data && data.transactions.successRate >= 99 ? 'success' : 'warning'}
          loading={loading}
        />
        <MetricCard
          title="Revertidas"
          value={data ? formatNumber(data.transactions.voided) : '—'}
          icon={<RotateCcw size={18} className="text-red-400" />}
          loading={loading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Processado"
          value={data ? formatNumber(data.transactions.total) : '—'}
          subtitle="Todas as transações"
          loading={loading}
          size="sm"
        />
        <MetricCard
          title="Taxa de Falha"
          value={data ? formatPercent(data.transactions.failureRate) : '—'}
          icon={<XCircle size={18} className="text-red-500" />}
          variant={data && data.transactions.failureRate > 1 ? 'danger' : 'default'}
          loading={loading}
          size="sm"
        />
        <MetricCard
          title="TPS Pico"
          value={data ? data.tps.peak.toFixed(3) : '—'}
          subtitle="última hora"
          loading={loading}
          size="sm"
        />
        <MetricCard
          title="Último Minuto"
          value={data ? formatNumber(data.transactions.lastMinute) : '—'}
          loading={loading}
          size="sm"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Volume por Hora — últimas 24h (R$)</h3>
          {loading ? (
            <div className="h-48 animate-pulse bg-slate-100 rounded" />
          ) : (
            <AreaChartComponent data={hourlyData} color="#00B37E" />
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Volume por Dia — últimos 30 dias</h3>
          {loading ? (
            <div className="h-48 animate-pulse bg-slate-100 rounded" />
          ) : (
            <BarChartComponent data={dailyData} />
          )}
        </div>
      </div>

      {/* Monthly */}
      {data && data.volumeByMonth.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Crescimento Mensal — últimos 12 meses (R$)</h3>
          <AreaChartComponent
            data={data.volumeByMonth.map(d => ({
              label: new Date(d.month).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
              value: parseFloat(d.volume),
            }))}
            color="#3B82F6"
          />
        </div>
      )}
    </div>
  )
}
