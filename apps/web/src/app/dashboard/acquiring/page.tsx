'use client'

import MetricCard from '@/components/ui/MetricCard'
import { CreditCard, TrendingUp, AlertTriangle, Clock, Percent, Split } from 'lucide-react'

export default function AcquiringPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">Adquirência</h1>
            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">Em Breve</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Processamento de cartões, MDR, recebíveis e antecipações</p>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <CreditCard size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Módulo de Adquirência — Fase 3 do Roadmap</p>
            <p className="text-xs text-blue-600 mt-0.5">Integração com bandeiras, processadoras e agenda de recebíveis</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Processamento de Cartões', desc: 'Débito, crédito à vista e parcelado' },
            { label: 'Agenda de Recebíveis', desc: 'Domicílio bancário e antecipação de ARV' },
            { label: 'Split de Pagamentos', desc: 'Divisão automática entre sub-merchants' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-lg border border-blue-200 p-3">
              <p className="text-xs font-semibold text-blue-800">{item.label}</p>
              <p className="text-xs text-blue-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* TPV & Revenue */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Volume e Receita (Fase 3)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="TPV Mensal" value="R$ 0,00" subtitle="Total Payment Volume" icon={<TrendingUp size={18} className="text-blue-400" />} prepared />
          <MetricCard title="MDR Médio" value="0,00%" subtitle="Merchant Discount Rate" icon={<Percent size={18} className="text-emerald-400" />} prepared />
          <MetricCard title="Receita MDR" value="R$ 0,00" subtitle="Receita bruta de adquirência" icon={<TrendingUp size={18} className="text-bass-400" />} prepared />
        </div>
      </div>

      {/* Chargebacks & Risk */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Chargebacks e Risco (Fase 3)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="Chargebacks" value="0" subtitle="Disputas no período" icon={<AlertTriangle size={18} className="text-red-400" />} prepared />
          <MetricCard title="Taxa de Chargeback" value="0,00%" subtitle="Meta: < 1%" icon={<Percent size={18} className="text-amber-400" />} prepared />
          <MetricCard title="Volume em Disputa" value="R$ 0,00" subtitle="Aguardando resolução" icon={<Clock size={18} className="text-slate-400" />} prepared />
        </div>
      </div>

      {/* Receivables & Split */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Recebíveis e Split (Fase 3)</h2>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard title="Recebíveis Futuros" value="R$ 0,00" subtitle="Agenda D+2 a D+30" icon={<Clock size={18} className="text-blue-400" />} prepared />
          <MetricCard title="Split Payments" value="0" subtitle="Transações divididas" icon={<Split size={18} className="text-slate-400" />} prepared />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Cronograma de Implementação — Adquirência</h3>
        <div className="space-y-4">
          {[
            { phase: 'Fase 1.5', done: true, label: 'Estrutura de contas preparada para transações de cartão', sub: 'Ledger entries com referenceType=CARD' },
            { phase: 'Fase 3', done: false, label: 'Integração com bandeiras Visa/Mastercard via ISO 8583', sub: 'Processadora parceira + tokenização PCI-DSS' },
            { phase: 'Fase 3', done: false, label: 'Agenda de recebíveis e domicílio bancário', sub: 'ARV — Antecipação de Recebíveis' },
            { phase: 'Fase 3', done: false, label: 'Split automático de pagamentos', sub: 'Divisão entre marketplace e sub-merchants' },
            { phase: 'Fase 4', done: false, label: 'MDR dinâmico e pricing personalizado por merchant', sub: 'Engine de precificação + tabelas de intercâmbio' },
            { phase: 'Fase 5', done: false, label: 'Conciliação automática e relatórios CNAB 240', sub: 'Integração bancária completa' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full border-2 mt-0.5 ${item.done ? 'bg-bass-500 border-bass-500' : 'bg-white border-slate-300'}`} />
                {i < 5 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
              </div>
              <div className="pb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.done ? 'bg-bass-100 text-bass-700' : 'bg-slate-100 text-slate-500'}`}>{item.phase}</span>
                  <p className={`text-sm font-medium ${item.done ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</p>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 ml-16">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
