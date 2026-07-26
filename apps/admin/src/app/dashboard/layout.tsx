'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar, NavItem } from '@/components/Sidebar'

const NAV: NavItem[] = [
  { label: 'Visão global', href: '/dashboard' },
  { label: 'Clientes', href: '/dashboard/clientes' },
  { label: 'Organizações', href: '/dashboard/organizacoes' },
  { label: 'Usuários', href: '/dashboard/usuarios' },
  { label: 'Papéis & RBAC', href: '/dashboard/rbac' },
  { label: 'Ledger global', href: '/dashboard/ledger' },
  { label: 'Gateway instantâneo', href: '/dashboard/gateway' },
  { label: 'Compliance', href: '/dashboard/compliance' },
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
    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', minHeight: '100vh' }}>
      <Sidebar brandName="Bass" brandSub="Financial Core" envLabel="◆ Ambiente Administrativo" markChar="B" markColor="#fff" nav={NAV} />
      <main style={{ minWidth: 0, padding: '22px 24px 60px', maxWidth: 1520 }}>{children}</main>
    </div>
  )
}
