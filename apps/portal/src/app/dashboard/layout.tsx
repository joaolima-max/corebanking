'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar, NavItem } from '@/components/Sidebar'

const NAV: NavItem[] = [
  { label: 'Início', href: '/dashboard' },
  { label: 'Receber (PIX)', href: '/dashboard/pix', tag: 'PIX' },
  { label: 'Contas & Saldos', href: '/dashboard/contas' },
  { label: 'Extrato', href: '/dashboard/extrato' },
  { label: 'Developers', href: '/dashboard/developers' },
  { label: 'Minha conta', href: '/dashboard/conta' },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isHydrating } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isHydrating && !isAuthenticated) router.replace('/login')
  }, [isHydrating, isAuthenticated, router])

  if (isHydrating || !isAuthenticated) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>Carregando…</div>
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '244px 1fr', minHeight: '100vh' }}>
      <Sidebar brandName="Aurora Pay" brandSub="powered by Bass" envLabel="● Ambiente do Cliente" markChar="A" markColor="#07120e" nav={NAV} />
      <main style={{ minWidth: 0, padding: '22px 24px 60px', maxWidth: 1240 }}>{children}</main>
    </div>
  )
}
