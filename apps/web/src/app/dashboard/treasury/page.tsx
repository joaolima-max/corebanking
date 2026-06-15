'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import MetricCard from '@/components/ui/MetricCard'
import { Banknote, Lock, ArrowRight, TrendingUp } from 'lucide-react'

interface TreasuryMetrics {
  prepared: true
  cashPosition: {
    consolidated: string
    available: string
    reserved: string
    projected: string
  }
  funding: {
    utilized: string
    available: string
  }
  currency: string
}

export default function TreasuryPage() {
  const { token } = useAuth()
  const [data, setData] = useState<TreasuryMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.get<TreasuryMetrics>('/api/v1/dashboard/treasury', token)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">Tesouraria</h1>
            <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded-full">Preparado</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Gestão de caixa e funding da plataforma</p>
        </div>
      </div>

      {/* Prepared banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
          <Banknote size={16} className="text-purple-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-purple-800">Módulo em Desenvolvimento — Fase 2</p>
          <p className="text-xs text-purple-600 mt-1">
            Os dados abaixo são calculados a partir das contas operacionais existentes.
            Na Fase 2, este módulo integrará PIX, Settlement em tempo real, projeções de liquidez e funding externo.
          </p>
        </div>
      </div>

      {/* Cash Position */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Posição de Caixa</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Caixa Consolidado"
            value={data ? formatCurrency(data.cashPosition.consolidated) : '—'}
            subtitle="Conta Operacional"
            icon={<Banknote size={18} className="text-bass-500" />}
            loading={loading}
            size="lg"
          />
          <MetricCard
            title="Caixa Disponível"
            value={data ? formatCurrency(data.cashPosition.available) : '—'}
            subtitle="Disponível para uso"
            variant="success"
            loading={loading}
            size="lg"
          />
          <MetricCard
            title="Caixa Reservado"
            value={data ? formatCurrency(data.cashPosition.reserved) : '—'}
            subtitle="Conta RESERVE"
            icon={<Lock size={18} className="text-amber-500" />}
            loading={loading}
            size="lg"
          />
          <MetricCard
            title="Liquidez Projetada"
            value={data ? formatCurrency(data.cashPosition.projected) : '—'}
            subtitle="Operacional + Reserva"
            icon={<TrendingUp size={18} className="text-blue-500" />}
            loading={loading}
            size="lg"
          />
        </div>
      </div>

      {/* Funding */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Funding</h2>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Funding Utilizado"
            value={data ? formatCurrency(data.funding.utilized) : '—'}
            subtitle="Fase 2 — PIX/Externo"
            prepared
            loading={loading}
            size="md"
          />
          <MetricCard
            title="Funding Disponível"
            value={data ? formatCurrency(data.funding.available) : '—'}
            subtitle="= Saldo Custodiado total"
            loading={loading}
            size="md"
          />
        </div>
      </div>

      {/* Roadmap */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Roadmap do Módulo de Tesouraria</h3>
        <div className="space-y-3">
          {[
            { phase: 'Fase 1.5', label: 'Dashboard básico de caixa a partir de contas operacionais', done: true },
            { phase: 'Fase 2', label: 'Integração PIX IN/OUT em tempo real, projeção de liquidez intraday', done: false },
            { phase: 'Fase 2', label: 'Settlement automático com bancos parceiros', done: false },
            { phase: 'Fase 3', label: 'Funding com integração CVM/B3', done: false },
            { phase: 'Fase 4', label: 'Gestão de FX e stablecoins', done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.done ? 'bg-bass-100 text-bass-700' : 'bg-slate-100 text-slate-500'}`}>
                {item.phase}
              </span>
              <ArrowRight size={12} className="text-slate-300 shrink-0" />
              <p className={`text-sm ${item.done ? 'text-slate-700' : 'text-slate-400'}`}>{item.label}</p>
              {item.done && <span className="ml-auto text-xs text-bass-600">✓ Ativo</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
