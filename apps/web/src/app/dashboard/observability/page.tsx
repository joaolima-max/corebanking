'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatLatency, formatUptime, formatBytes } from '@/lib/format'
import MetricCard from '@/components/ui/MetricCard'
import { Database, Cpu, HardDrive, Clock, Activity, Server } from 'lucide-react'

interface ObservabilityMetrics {
  database: { status: string; latencyMs: number; connections: number }
  redis: { status: string; latencyMs: number }
  process: { memoryUsedMb: number; memoryTotalMb: number; uptimeSeconds: number; nodeVersion: string }
  api: { requestsPerMinute: number; avgLatencyMs: number; p99LatencyMs: number }
}

function StatusBadge({ status }: { status: string }) {
  const ok = status === 'ok' || status === 'healthy' || status === 'connected'
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {ok ? 'Saudável' : 'Degradado'}
    </span>
  )
}

export default function ObservabilityPage() {
  const { token } = useAuth()
  const [data, setData] = useState<ObservabilityMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const fetch = () => {
      api.get<ObservabilityMetrics>('/api/v1/dashboard/observability', token)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
    fetch()
    const interval = setInterval(fetch, 15000)
    return () => clearInterval(interval)
  }, [token])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Observabilidade</h1>
          <p className="text-slate-500 text-sm mt-0.5">Saúde da plataforma e métricas de infraestrutura · atualiza a cada 15s</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-bass-600 bg-bass-50 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 bg-bass-500 rounded-full animate-pulse" />
          Ao Vivo
        </div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Database */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Database size={18} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">PostgreSQL</h3>
            </div>
            {loading ? (
              <div className="h-5 w-20 animate-pulse bg-slate-100 rounded-full" />
            ) : (
              <StatusBadge status={data?.database.status ?? 'unknown'} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              title="Latência"
              value={data ? formatLatency(data.database.latencyMs) : '—'}
              subtitle="Resposta DB"
              icon={<Clock size={16} className="text-blue-400" />}
              loading={loading}
              size="sm"
            />
            <MetricCard
              title="Conexões"
              value={data ? String(data.database.connections) : '—'}
              subtitle="Pool ativo"
              icon={<Activity size={16} className="text-slate-400" />}
              loading={loading}
              size="sm"
            />
          </div>
        </div>

        {/* Redis */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server size={18} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">Redis</h3>
            </div>
            {loading ? (
              <div className="h-5 w-20 animate-pulse bg-slate-100 rounded-full" />
            ) : (
              <StatusBadge status={data?.redis.status ?? 'unknown'} />
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <MetricCard
              title="Latência"
              value={data ? formatLatency(data.redis.latencyMs) : '—'}
              subtitle="Resposta Redis"
              icon={<Clock size={16} className="text-amber-400" />}
              loading={loading}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Process */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Processo Node.js</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Memória Usada"
            value={data ? formatBytes(data.process.memoryUsedMb * 1024 * 1024) : '—'}
            icon={<HardDrive size={18} className="text-purple-500" />}
            loading={loading}
          />
          <MetricCard
            title="Memória Total"
            value={data ? formatBytes(data.process.memoryTotalMb * 1024 * 1024) : '—'}
            subtitle="Heap alocado"
            loading={loading}
          />
          <MetricCard
            title="Uptime"
            value={data ? formatUptime(data.process.uptimeSeconds) : '—'}
            icon={<Clock size={18} className="text-emerald-500" />}
            loading={loading}
          />
          <MetricCard
            title="Node.js"
            value={data?.process.nodeVersion ?? '—'}
            subtitle="Versão do runtime"
            icon={<Cpu size={18} className="text-slate-400" />}
            loading={loading}
          />
        </div>
      </div>

      {/* API Latency */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Performance da API</h2>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Req/min"
            value={data ? String(data.api.requestsPerMinute) : '—'}
            subtitle="Requisições por minuto"
            icon={<Activity size={18} className="text-bass-500" />}
            loading={loading}
          />
          <MetricCard
            title="Latência Média"
            value={data ? formatLatency(data.api.avgLatencyMs) : '—'}
            subtitle="Tempo de resposta médio"
            icon={<Clock size={18} className="text-blue-500" />}
            loading={loading}
          />
          <MetricCard
            title="P99 Latência"
            value={data ? formatLatency(data.api.p99LatencyMs) : '—'}
            subtitle="99º percentil"
            icon={<Clock size={18} className="text-amber-500" />}
            variant={data && data.api.p99LatencyMs > 1000 ? 'warning' : 'default'}
            loading={loading}
          />
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity size={16} className="text-slate-500" />
          <p className="text-sm font-medium text-slate-700">Sobre Observabilidade</p>
        </div>
        <p className="text-xs text-slate-500">
          Métricas coletadas em tempo real do processo Node.js, conexão PostgreSQL e Redis.
          Na Fase 4, integraremos OpenTelemetry, Prometheus e Grafana para observabilidade completa com traces distribuídos.
        </p>
      </div>
    </div>
  )
}
