'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth'
import { api, ApiError } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import MetricCard from '@/components/ui/MetricCard'
import { Zap, ArrowDownLeft, ArrowUpRight, Key, Plus, Send, QrCode, Trash2, X } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PixStats {
  keysCount: number
  qrCodesCount: number
  pixIn: { count: number; total: string | number | null }
  pixOut: { count: number; total: string | number | null }
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

const PIX_KEY_TYPES = ['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'] as const

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-slate-100 text-slate-600',
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PixPage() {
  const { token } = useAuth()

  const [stats, setStats] = useState<PixStats | null>(null)
  const [keys, setKeys] = useState<PixKey[]>([])
  const [transfers, setTransfers] = useState<PixTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form modals
  const [showKeyForm, setShowKeyForm] = useState(false)
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [showQrForm, setShowQrForm] = useState(false)

  const fetchAll = useCallback(async () => {
    if (!token) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const [s, k, t] = await Promise.all([
        api.get<PixStats>('/api/v1/pix/stats', token),
        api.get<PixKey[]>('/api/v1/pix/keys', token),
        api.get<PixTransfer[]>('/api/v1/pix/transfers', token),
      ])
      setStats(s)
      setKeys(k)
      setTransfers(t)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar dados PIX')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleDeleteKey = async (id: string) => {
    if (!token) return
    try {
      await fetch(`/api/v1/pix/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchAll()
    } catch {
      // ignore
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
            onClick={() => setShowKeyForm(true)}
            className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Key size={14} />
            Registrar Chave
          </button>
          <button
            onClick={() => setShowQrForm(true)}
            className="flex items-center gap-1.5 text-sm bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <QrCode size={14} />
            Gerar QR Code
          </button>
          <button
            onClick={() => setShowTransferForm(true)}
            className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Send size={14} />
            Enviar PIX
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Indicadores PIX</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="PIX IN"
            value={stats ? formatCurrency(stats.pixIn.total ?? 0) : '—'}
            subtitle={`${stats?.pixIn.count ?? 0} transações`}
            icon={<ArrowDownLeft size={18} className="text-emerald-400" />}
            loading={loading}
            variant="success"
          />
          <MetricCard
            title="PIX OUT"
            value={stats ? formatCurrency(stats.pixOut.total ?? 0) : '—'}
            subtitle={`${stats?.pixOut.count ?? 0} transações`}
            icon={<ArrowUpRight size={18} className="text-blue-400" />}
            loading={loading}
          />
          <MetricCard
            title="Chaves PIX"
            value={stats?.keysCount ?? '—'}
            subtitle="Chaves ativas"
            icon={<Key size={18} className="text-slate-400" />}
            loading={loading}
          />
          <MetricCard
            title="QR Codes"
            value={stats?.qrCodesCount ?? '—'}
            subtitle="QR codes ativos"
            icon={<QrCode size={18} className="text-purple-400" />}
            loading={loading}
          />
        </div>
      </div>

      {/* PIX Keys */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chaves PIX</h2>
          <button
            onClick={() => setShowKeyForm(true)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Plus size={12} />
            Adicionar
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-400">Carregando...</div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center">
              <Key size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma chave PIX cadastrada</p>
              <button
                onClick={() => setShowKeyForm(true)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Registrar primeira chave
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Chave</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Conta</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                        {key.keyType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{key.keyValue}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{key.accountId.substring(0, 8)}…</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                        {key.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Deletar chave"
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
      </div>

      {/* Recent Transfers */}
      <div>
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Transferências Recentes</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-400">Carregando...</div>
          ) : transfers.length === 0 ? (
            <div className="p-8 text-center">
              <Zap size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma transferência PIX realizada</p>
              <button
                onClick={() => setShowTransferForm(true)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Fazer primeiro PIX
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">E2E ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Chave</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Valor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.e2eId.substring(0, 20)}…</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{t.pixKeyType}</span>
                        <span className="text-xs text-slate-700">{t.pixKey}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[t.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showKeyForm && token && (
        <RegisterKeyModal token={token} onClose={() => { setShowKeyForm(false); fetchAll() }} />
      )}
      {showTransferForm && token && (
        <SendPixModal token={token} onClose={() => { setShowTransferForm(false); fetchAll() }} />
      )}
      {showQrForm && token && (
        <GenerateQrModal token={token} pixKeys={keys} onClose={() => { setShowQrForm(false); fetchAll() }} />
      )}
    </div>
  )
}

// ─── Register Key Modal ───────────────────────────────────────────────────────

function RegisterKeyModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [keyType, setKeyType] = useState<string>('EMAIL')
  const [keyValue, setKeyValue] = useState('')
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId.trim()) { setError('Informe o ID da conta'); return }
    setLoading(true)
    setError(null)
    try {
      await api.post('/api/v1/pix/keys', { accountId, keyType, keyValue: keyType === 'EVP' ? '' : keyValue }, token)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao registrar chave')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Registrar Chave PIX" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">ID da Conta</label>
          <input
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="UUID da conta"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Chave</label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={keyType}
            onChange={(e) => setKeyType(e.target.value)}
          >
            {PIX_KEY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {keyType !== 'EVP' && (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor da Chave</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={
                keyType === 'EMAIL' ? 'email@exemplo.com' :
                keyType === 'CPF' ? '000.000.000-00' :
                keyType === 'CNPJ' ? '00.000.000/0000-00' :
                '+5511999999999'
              }
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              required
            />
          </div>
        )}
        {keyType === 'EVP' && (
          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            Uma chave EVP (aleatória) será gerada automaticamente pelo sistema.
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Registrando…' : 'Registrar Chave'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Send PIX Modal ───────────────────────────────────────────────────────────

function SendPixModal({ token, onClose }: { token: string; onClose: () => void }) {
  const [senderAccountId, setSenderAccountId] = useState('')
  const [pixKeyType, setPixKeyType] = useState('EMAIL')
  const [pixKey, setPixKey] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await api.post('/api/v1/pix/transfers', {
        senderAccountId,
        pixKeyType,
        pixKey,
        amount,
        description: description || undefined,
      }, token)
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar PIX')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Enviar PIX" onClose={onClose}>
      {success ? (
        <div className="py-6 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Zap size={24} className="text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-emerald-700">PIX enviado com sucesso!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ID da Conta Remetente</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="UUID da conta"
              value={senderAccountId}
              onChange={(e) => setSenderAccountId(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de Chave</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value)}
              >
                {PIX_KEY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Chave PIX</label>
              <input
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chave do destinatário"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrição (opcional)</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Motivo do pagamento"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Enviando…' : 'Enviar PIX'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ─── Generate QR Code Modal ───────────────────────────────────────────────────

function GenerateQrModal({ token, pixKeys, onClose }: { token: string; pixKeys: PixKey[]; onClose: () => void }) {
  const [accountId, setAccountId] = useState('')
  const [pixKeyId, setPixKeyId] = useState('')
  const [type, setType] = useState('STATIC')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ payload: string } | null>(null)

  const filteredKeys = accountId ? pixKeys.filter((k) => k.accountId === accountId) : pixKeys

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await api.post<{ payload: string }>('/api/v1/pix/qr-codes', {
        accountId,
        pixKeyId,
        type,
        amount: amount || undefined,
        description: description || undefined,
      }, token)
      setResult(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao gerar QR code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Gerar QR Code PIX" onClose={onClose}>
      {result ? (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Payload EMV</p>
            <p className="font-mono text-xs text-slate-800 break-all">{result.payload}</p>
          </div>
          <button onClick={onClose} className="w-full border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50">
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ID da Conta</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="UUID da conta"
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); setPixKeyId('') }}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Chave PIX</label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pixKeyId}
              onChange={(e) => setPixKeyId(e.target.value)}
              required
            >
              <option value="">Selecione uma chave...</option>
              {filteredKeys.map((k) => (
                <option key={k.id} value={k.id}>{k.keyType}: {k.keyValue}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
            <div className="flex gap-2">
              {['STATIC', 'DYNAMIC'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                    type === t
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t === 'STATIC' ? 'Estático' : 'Dinâmico'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$) — opcional para estático</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descrição (opcional)</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Referência do pagamento"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Gerando…' : 'Gerar QR Code'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

// ─── Modal Wrapper ────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
