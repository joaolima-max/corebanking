'use client'

import MetricCard from '@/components/ui/MetricCard'
import { Zap, ArrowDownLeft, ArrowUpRight, Key, Search, Percent } from 'lucide-react'

export default function PixPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">PIX</h1>
            <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">Em Breve</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Sistema de Pagamentos Instantâneos do Banco Central</p>
        </div>
      </div>

      {/* Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">PIX Integration — Fase 2 do Roadmap</p>
            <p className="text-xs text-blue-600 mt-0.5">A estrutura técnica está preparada para receber esta integração</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
          {[
            { label: 'SPI — Sistema de Pagamentos Instantâneos', desc: 'Integração via ISPB com o BACEN' },
            { label: 'DICT — Diretório de Identificadores', desc: 'Cadastro e consulta de chaves PIX' },
            { label: 'MED — Mecanismo Especial de Devolução', desc: 'Devolução de transações suspeitas' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-lg border border-blue-200 p-3">
              <p className="text-xs font-semibold text-blue-800">{item.label}</p>
              <p className="text-xs text-blue-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Empty metrics */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Indicadores PIX (Fase 2)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard title="PIX IN" value="R$ 0,00" subtitle="Recebimentos" icon={<ArrowDownLeft size={18} className="text-emerald-400" />} prepared />
          <MetricCard title="PIX OUT" value="R$ 0,00" subtitle="Envios" icon={<ArrowUpRight size={18} className="text-blue-400" />} prepared />
          <MetricCard title="MEDs" value="0" subtitle="Devoluções" icon={<Zap size={18} className="text-amber-400" />} prepared />
          <MetricCard title="Consultas DICT" value="0" subtitle="Consultas por hora" icon={<Search size={18} className="text-slate-400" />} prepared />
          <MetricCard title="Chaves PIX" value="0" subtitle="Chaves cadastradas" icon={<Key size={18} className="text-slate-400" />} prepared />
          <MetricCard title="Taxa de Conversão" value="0%" subtitle="PIX/total transações" icon={<Percent size={18} className="text-slate-400" />} prepared />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Cronograma de Implementação PIX</h3>
        <div className="space-y-4">
          {[
            { phase: 'Fase 1.5', done: true, label: 'Estrutura de ledger preparada para movimentações PIX', sub: 'Journal entries com referenceType=PIX' },
            { phase: 'Fase 2', done: false, label: 'Integração SPI via ISPB — PIX IN e PIX OUT síncronos', sub: 'Webhooks BACEN, validação de assinatura JWS' },
            { phase: 'Fase 2', done: false, label: 'DICT — Cadastro e consulta de chaves PIX (CPF, CNPJ, email, telefone, EVP)', sub: 'API DICT com retry e cache' },
            { phase: 'Fase 2', done: false, label: 'MED — Mecanismo Especial de Devolução', sub: 'Fluxo de contestação e devoluções automáticas' },
            { phase: 'Fase 3', done: false, label: 'PIX Cobrança (QR Code estático e dinâmico)', sub: 'Geração via pix-utils, link de pagamento' },
            { phase: 'Fase 5', done: false, label: 'PIX Saque, PIX Troco, PIX Automático (Fase Beta)', sub: 'Módulo de compliance integrado' },
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
