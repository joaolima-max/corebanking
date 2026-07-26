'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar, NavGroup } from '@/components/Sidebar'

const GROUPS: NavGroup[] = [
  {
    group: 'Plataforma',
    items: [
      { label: 'Visão global', href: '/dashboard', keywords: 'home overview' },
      { label: 'Merchants', href: '/dashboard/merchants', keywords: 'white label ambientes grupo' },
      { label: 'Submerchants', href: '/dashboard/submerchants', keywords: 'clientes sellers contas' },
      { label: 'Transações', href: '/dashboard/transacoes', keywords: 'pagamentos e2e extrato seller' },
    ],
  },
  {
    group: 'Financeiro',
    items: [
      { label: 'Ledger global', href: '/dashboard/ledger', keywords: 'contabilidade lançamentos' },
      { label: 'FX & Liquidez', href: '/dashboard/fx', keywords: 'cambio conversao stablecoin' },
      { label: 'Faturamento & Tarifas', href: '/dashboard/faturamento', keywords: 'billing fees taxas cobranca' },
    ],
  },
  {
    group: 'Risco & Compliance',
    items: [
      { label: 'KYC Onboarding', href: '/dashboard/kyc', keywords: 'cadastro documentos identidade kyb' },
      { label: 'PLD/FT', href: '/dashboard/pld', keywords: 'aml lavagem financiamento terrorismo' },
      { label: 'Monitoramento de risco', href: '/dashboard/risco', keywords: 'alertas transacional' },
      { label: 'Régua de risco', href: '/dashboard/regua', keywords: 'regras score limites' },
      { label: 'Antifraude', href: '/dashboard/antifraude', keywords: 'documentos negados fraude' },
      { label: 'Infrações (MEDs)', href: '/dashboard/infracoes', keywords: 'med devolucao especial pix' },
    ],
  },
  {
    group: 'Infra & Governança',
    items: [
      { label: 'Gateway instantâneo', href: '/dashboard/gateway', keywords: 'rails mojaloop pix spei' },
      { label: 'Equipe', href: '/dashboard/equipe', keywords: 'usuarios time' },
      { label: 'Papéis & RBAC', href: '/dashboard/rbac', keywords: 'permissoes acesso' },
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
      <Sidebar brandName="Bass" brandSub="Financial Core" markChar="B" markColor="#fff" groups={GROUPS} />
      <main style={{ minWidth: 0, padding: '22px 24px 60px', maxWidth: 1520 }}>{children}</main>
    </div>
  )
}
