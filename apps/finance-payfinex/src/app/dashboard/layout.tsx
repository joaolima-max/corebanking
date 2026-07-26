'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar, NavGroup } from '@/components/Sidebar'

// Payfinex: grandes clientes · básico bem feito · sem automações/gráficos.
const GROUPS: NavGroup[] = [
  {
    group: 'Visão',
    items: [
      { label: 'Início', href: '/dashboard', keywords: 'home resumo' },
      { label: 'Extrato', href: '/dashboard/extrato', keywords: 'movimentacoes' },
    ],
  },
  {
    group: 'Câmbio',
    items: [
      { label: 'Converter (BRL ⇄ USD)', href: '/dashboard/conversao', keywords: 'cambio usd dolar real converter' },
      { label: 'Saldos & Wallets', href: '/dashboard/contas', keywords: 'saldo carteira brl usd' },
    ],
  },
  {
    group: 'Integração',
    items: [
      { label: 'Developers', href: '/dashboard/developers', keywords: 'api keys' },
      { label: 'Webhooks', href: '/dashboard/webhooks', keywords: 'eventos reenvio' },
    ],
  },
  {
    group: 'Conta',
    items: [
      { label: 'Configurações', href: '/dashboard/config', keywords: 'perfil 2fa' },
      { label: 'Minha conta', href: '/dashboard/conta', keywords: 'perfil' },
    ],
  },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrating } = useAuth()
  const router = useRouter()
  useEffect(() => { if (!isHydrating && !isAuthenticated) router.replace('/login') }, [isHydrating, isAuthenticated, router])
  if (isHydrating || !isAuthenticated) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>Carregando…</div>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '244px 1fr', minHeight: '100vh' }}>
      <Sidebar brandName="Finance Payfinex" brandSub="powered by Core" markChar="P" markColor="#fff" groups={GROUPS} />
      <main style={{ minWidth: 0, padding: '22px 24px 60px', maxWidth: 1160 }}>{children}</main>
    </div>
  )
}
