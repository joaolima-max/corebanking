'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar, NavGroup } from '@/components/Sidebar'

const GROUPS: NavGroup[] = [
  {
    group: 'Plataforma',
    items: [
      { label: 'Visão global', href: '/dashboard', keywords: 'home overview slas' },
      { label: 'Merchants', href: '/dashboard/merchants', keywords: 'white label ambientes grupo' },
      { label: 'Submerchants', href: '/dashboard/submerchants', keywords: 'clientes sellers contas' },
      { label: 'Transações', href: '/dashboard/transacoes', keywords: 'pagamentos e2e extrato seller' },
    ],
  },
  {
    group: 'Financeiro',
    items: [
      { label: 'Ledger global', href: '/dashboard/ledger', keywords: 'contabilidade lançamentos pote' },
      { label: 'Contabilidade', href: '/dashboard/contabilidade', keywords: 'conciliacao balanco ativo passivo tesouraria' },
      { label: 'FX & Liquidez', href: '/dashboard/fx', keywords: 'cambio conversao stablecoin' },
      { label: 'Faturamento & Tarifas', href: '/dashboard/faturamento', keywords: 'billing fees taxas split cobranca mensalidade lancamento' },
      { label: 'Planos & Limites', href: '/dashboard/planos', keywords: 'plano limite kyc padrao' },
    ],
  },
  {
    group: 'Risco & Compliance',
    items: [
      { label: 'KYC Onboarding', href: '/dashboard/kyc', keywords: 'cadastro documentos identidade kyb' },
      { label: 'PLD/FT', href: '/dashboard/pld', keywords: 'aml lavagem' },
      { label: 'Monitoramento de risco', href: '/dashboard/risco', keywords: 'alertas' },
      { label: 'Régua de risco', href: '/dashboard/regua', keywords: 'regras score' },
      { label: 'Antifraude', href: '/dashboard/antifraude', keywords: 'documentos negados' },
      { label: 'Infrações (MEDs)', href: '/dashboard/infracoes', keywords: 'med devolucao' },
    ],
  },
  {
    group: 'Operação',
    items: [
      { label: 'Webhooks', href: '/dashboard/webhooks', keywords: 'reenvio falha entregas eventos' },
      { label: 'Notificações', href: '/dashboard/notificacoes', keywords: 'twilio sms email provedor broadcast comunicado' },
      { label: 'Gateway instantâneo', href: '/dashboard/gateway', keywords: 'rails mojaloop' },
    ],
  },
  {
    group: 'Governança',
    items: [
      { label: 'Segurança', href: '/dashboard/seguranca', keywords: 'dispositivos aprovar multi acesso convite' },
      { label: 'Equipe', href: '/dashboard/equipe', keywords: 'usuarios time' },
      { label: 'Papéis & RBAC', href: '/dashboard/rbac', keywords: 'permissoes acesso' },
      { label: 'Configurações', href: '/dashboard/config', keywords: 'perfil senha 2fa email telefone permissoes' },
    ],
  },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrating } = useAuth()
  const router = useRouter()
  useEffect(() => { if (!isHydrating && !isAuthenticated) router.replace('/login') }, [isHydrating, isAuthenticated, router])
  if (isHydrating || !isAuthenticated) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>Carregando…</div>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '252px 1fr', minHeight: '100vh' }}>
      <Sidebar brandName="Core" brandSub="Administrativo" markChar="B" markColor="#fff" groups={GROUPS} />
      <main style={{ minWidth: 0, padding: '22px 24px 60px', maxWidth: 1520 }}>{children}</main>
    </div>
  )
}
