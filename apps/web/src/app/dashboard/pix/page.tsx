'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import MetricCard from '@/components/ui/MetricCard'
import { Zap, ArrowDownLeft, ArrowUpRight, Key, QrCode, Trash2, Plus, Send } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PixStats {
  keysCount: number
  qrCodesCount: number
  pixIn: { count: number; total: string | number }
  pixOut: { count: number; total: string | number }
}

interface PixKey {
  id: string
  keyType: string
  keyValue: string
  accountId: string
  status: string
  createdAt: string
}

interface PixTransfer {
  id: string
  senderAccountId: string
  receiverAccountId: string | null
  amount: string
  currency: string
  status: string
  e2eId: string
  pixKey: string
  pixKeyType: string
  description: string | null
  createdAt: string
}

const KEY_TYPE_LABELS: Record<string, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  PHONE: 'Telefone',
  EVP: 'Chave Aleatória (EVP)',
}

const TRANSFER_STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-slate-100 text-slate-600',
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PixPage() {
  const { token } = useAuth()

  const [stats, setStats] = useState<PixStats | null>(null)
  const [keys, setKeys] = useState<PixKey[]>([])
  const [transfers, setTransfers] = useState<PixTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Register key form
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [keyForm, setKeyForm] = useState({ accountId: '', keyType: 'EMAIL', keyValue: '' })
  const [keyFormLoading, setKeyFormLoading] = useState(false)
  const [keyFormError, setKeyFormError] = useState('')

  // Transfer form
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [transferForm, setTransferForm] = useState({
    senderAccountId: '',
    pixKeyType: 'EMAIL',
    pixKey: '',
    amount: '',
    description: '',
  })
  const [transferFormLoading, setTransferFormLoading] = useState(false)
  const [transferFormError, setTransferFormError] = useState('')
  const [transferSuccess, setTransferSuccess] = useState('')

  // QR Code form
  const [showQrForm, setShowQrForm] = useState(false)
  const [qrForm, setQrForm] = useState({ accountId: '', pixKeyId: '', type: 'STATIC', amount: '', description: '' })
  const [qrFormLoading, setQrFormLoading] = useState(false)
  const [qrFormError, setQrFormError] = useState('')
  const [qrPayload, setQrPayload] = useState('')

  const loadData = () => {
    if (!token) { setLoading(false); return }
    setLoading(true)
    Promise.all([
      api.get<PixStats>('/api/v1/pix/stats', token),
      api.get<PixKey[]>('/api/v1/pix/keys', token),
      api.get<PixTransfer[]>('/api/v1/pix/transfers', token),
    ])
      .then(([s, k, t]) => { setStats(s); setKeys(k); setTransfers(t) })
      .catch(() => setError('Erro ao carregar dados PIX'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteKey = async (id: string) => {
    if (!token) return
    try {
      const res = await fetch(`/api/v1/pix/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) loadData()
    } catch {
      setError('Erro ao excluir chave')
    }
  }

  const handleRegisterKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setKeyFormLoading(true)
    setKeyFormError('')
    try {
      await api.post('/api/v1/pix/keys', keyForm, token)
      setShowKeyForm(false)
      setKeyForm({ accountId: '', keyType: 'EMAIL', keyValue: '' })
      loadData()
    } catch (err) {
      setKeyFormError(err instanceof ApiError ? err.message : 'Erro ao registrar chave')
    } finally {
      setKeyFormLoading(false)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setTransferFormLoading(true)
    setTransferFormError('')
    setTransferSuccess('')
    try {
      await api.post('/api/v1/pix/transfers', transferForm, token)
      setTransferSuccess('PIX enviado com sucesso!')
      setShowTransferForm(false)
      setTransferForm({ senderAccountId: '', pixKeyType: 'EMAIL', pixKey: '', amount: '', description: '' })
      loadData()
    } catch (err) {
      setTransferFormError(err instanceof ApiError ? err.message : 'Erro ao enviar PIX')
    } finally {
      setTransferFormLoading(false)
    }
  }

  const handleCreateQrCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setQrFormLoading(true)
    setQrFormError('')
    setQrPayload('')
    try {
      const result = await api.post<{ payload: string }>('/api/v1/pix/qr-codes', qrForm, token)
      setQrPayload(result.payload)
      loadData()
    } catch (err) {
      setQrFormError(err instanceof ApiError ? err.message : 'Erro ao gerar QR Code')
    } finally {
      setQrFormLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">PIX</h1>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Ativo</span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Sistema de Pagamentos Instantâneos do Banco Central</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowKeyForm(v => !v)}
            className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Key size={14} />
            Registrar Chave
          </button>
          <button
            onClick={() => setShowTransferForm(v => !v)}
            className="flex items-center gap-1.5 text-sm bg-bass-600 text-white px-3 py-1.5 rounded-lg hover:bg-bass-700 transition-colors"
          >
            <Send size={14} />
            Enviar PIX
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}
      {transferSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg p-3">{transferSuccess}</div>
      )}

      {/* Stats */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Indicadores PIX</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="PIX IN"
            value={stats ? formatCurrency(String(stats.pixIn.total)) : '—'}
            subtitle={`${stats?.pixIn.count ?? 0} recebimentos`}
            icon={<ArrowDownLeft size={18} className="text-emerald-400" />}
            loading={loading}
          />
          <MetricCard
            title="PIX OUT"
            value={stats ? formatCurrency(String(stats.pixOut.total)) : '—'}
            subtitle={`${stats?.pixOut.count ?? 0} envios`}
            icon={<ArrowUpRight size={18} className="text-blue-400" />}
            loading={loading}
          />
          <MetricCard
            title="Chaves PIX"
            value={stats ? String(stats.keysCount) : '—'}
            subtitle="Chaves ativas"
            icon={<Key size={18} className="text-slate-400" />}
            loading={loading}
          />
          <MetricCard
            title="QR Codes"
            value={stats ? String(stats.qrCodesCount) : '—'}
            subtitle="QR Codes ativos"
            icon={<QrCode size={18} className="text-purple-400" />}
            loading={loading}
          />
        </div>
      </div>

      {/* Register Key Form */}
      {showKeyForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Key size={16} className="text-slate-500" /> Registrar Chave PIX
          </h3>
          <form onSubmit={handleRegisterKey} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ID da Conta</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                  placeholder="UUID da conta"
                  value={keyForm.accountId}
                  onChange={e => setKeyForm(f => ({ ...f, accountId: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Chave</label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                  value={keyForm.keyType}
                  onChange={e => setKeyForm(f => ({ ...f, keyType: e.target.value }))}
                >
                  {Object.entries(KEY_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            {keyForm.keyType !== 'EVP' && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valor da Chave</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                  placeholder={keyForm.keyType === 'EMAIL' ? 'email@exemplo.com' : keyForm.keyType === 'CPF' ? '000.000.000-00' : keyForm.keyType === 'PHONE' ? '+55119XXXXXXXX' : ''}
                  value={keyForm.keyValue}
                  onChange={e => setKeyForm(f => ({ ...f, keyValue: e.target.value }))}
                  required
                />
              </div>
            )}
            {keyForm.keyType === 'EVP' && (
              <p className="text-xs text-slate-400">Uma chave aleatória (UUID) será gerada automaticamente.</p>
            )}
            {keyFormError && <p className="text-xs text-red-600">{keyFormError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={keyFormLoading} className="bg-bass-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-bass-700 disabled:opacity-50 transition-colors">
                {keyFormLoading ? 'Registrando...' : 'Registrar'}
              </button>
              <button type="button" onClick={() => setShowKeyForm(false)} className="text-sm text-slate-600 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Form */}
      {showTransferForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Send size={16} className="text-slate-500" /> Enviar PIX
          </h3>
          <form onSubmit={handleTransfer} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ID da Conta Remetente</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                  placeholder="UUID da conta"
                  value={transferForm.senderAccountId}
                  onChange={e => setTransferForm(f => ({ ...f, senderAccountId: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Chave PIX</label>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                  value={transferForm.pixKeyType}
                  onChange={e => setTransferForm(f => ({ ...f, pixKeyType: e.target.value }))}
                >
                  {Object.entries(KEY_TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Chave PIX do Destinatário</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                  placeholder="Valor da chave"
                  value={transferForm.pixKey}
                  onChange={e => setTransferForm(f => ({ ...f, pixKey: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Valor (BRL)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                  placeholder="0,00"
                  value={transferForm.amount}
                  onChange={e => setTransferForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Descrição (opcional)</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                placeholder="Motivo do pagamento"
                value={transferForm.description}
                onChange={e => setTransferForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            {transferFormError && <p className="text-xs text-red-600">{transferFormError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={transferFormLoading} className="bg-bass-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-bass-700 disabled:opacity-50 transition-colors">
                {transferFormLoading ? 'Enviando...' : 'Enviar PIX'}
              </button>
              <button type="button" onClick={() => setShowTransferForm(false)} className="text-sm text-slate-600 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* QR Code Button + Panel */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowQrForm(v => !v)}
          className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <QrCode size={14} />
          Gerar QR Code
        </button>
      </div>

      {/* QR Code Form */}
      {showQrForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <QrCode size={16} className="text-slate-500" /> Gerar QR Code PIX
          </h3>
          {qrPayload ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Payload EMV gerado com sucesso. Copie o código abaixo para usar em aplicativos:</p>
              <textarea
                readOnly
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono bg-slate-50 h-24 resize-none"
                value={qrPayload}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { void navigator.clipboard.writeText(qrPayload) }}
                  className="text-sm bg-bass-600 text-white px-4 py-2 rounded-lg hover:bg-bass-700 transition-colors"
                >
                  Copiar Payload
                </button>
                <button
                  onClick={() => { setQrPayload(''); setShowQrForm(false) }}
                  className="text-sm text-slate-600 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateQrCode} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ID da Conta</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                    placeholder="UUID da conta"
                    value={qrForm.accountId}
                    onChange={e => setQrForm(f => ({ ...f, accountId: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ID da Chave PIX</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                    placeholder="UUID da chave PIX"
                    value={qrForm.pixKeyId}
                    onChange={e => setQrForm(f => ({ ...f, pixKeyId: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                    value={qrForm.type}
                    onChange={e => setQrForm(f => ({ ...f, type: e.target.value }))}
                  >
                    <option value="STATIC">Estático</option>
                    <option value="DYNAMIC">Dinâmico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Valor (opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                    placeholder="0,00"
                    value={qrForm.amount}
                    onChange={e => setQrForm(f => ({ ...f, amount: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Descrição (opcional)</label>
                <input
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bass-500"
                  placeholder="Descrição do pagamento"
                  value={qrForm.description}
                  onChange={e => setQrForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              {qrFormError && <p className="text-xs text-red-600">{qrFormError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={qrFormLoading} className="bg-bass-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-bass-700 disabled:opacity-50 transition-colors">
                  {qrFormLoading ? 'Gerando...' : 'Gerar QR Code'}
                </button>
                <button type="button" onClick={() => setShowQrForm(false)} className="text-sm text-slate-600 px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* PIX Keys */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Chaves PIX</h3>
          <button
            onClick={() => setShowKeyForm(v => !v)}
            className="flex items-center gap-1 text-xs text-bass-600 hover:text-bass-700 font-medium"
          >
            <Plus size={12} /> Nova Chave
          </button>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-slate-400">Carregando...</div>
        ) : keys.length === 0 ? (
          <div className="p-5 text-center">
            <Key size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhuma chave PIX cadastrada</p>
            <button
              onClick={() => setShowKeyForm(true)}
              className="mt-3 text-xs text-bass-600 hover:underline"
            >
              Registrar primeira chave
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left px-5 py-2 font-medium">Tipo</th>
                <th className="text-left px-5 py-2 font-medium">Chave</th>
                <th className="text-left px-5 py-2 font-medium hidden sm:table-cell">Criada em</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      {KEY_TYPE_LABELS[k.keyType] ?? k.keyType}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-700">{k.keyValue}</td>
                  <td className="px-5 py-3 text-xs text-slate-400 hidden sm:table-cell">
                    {new Date(k.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                      title="Excluir chave"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transfers */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Transferências Recentes</h3>
          <button
            onClick={() => setShowTransferForm(v => !v)}
            className="flex items-center gap-1 text-xs text-bass-600 hover:text-bass-700 font-medium"
          >
            <Send size={12} /> Enviar PIX
          </button>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-slate-400">Carregando...</div>
        ) : transfers.length === 0 ? (
          <div className="p-5 text-center">
            <Zap size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Nenhuma transferência PIX realizada</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100">
                <th className="text-left px-5 py-2 font-medium">Chave</th>
                <th className="text-left px-5 py-2 font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-right px-5 py-2 font-medium">Valor</th>
                <th className="text-left px-5 py-2 font-medium">Status</th>
                <th className="text-left px-5 py-2 font-medium hidden md:table-cell">Data</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-slate-700 max-w-[120px] truncate">{t.pixKey}</td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {KEY_TYPE_LABELS[t.pixKeyType] ?? t.pixKeyType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-800">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRANSFER_STATUS_COLORS[t.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400 hidden md:table-cell">
                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
