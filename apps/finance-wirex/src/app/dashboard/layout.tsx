'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar, NavGroup } from '@/components/Sidebar'

const GROUPS: NavGroup[] = [
  {
    group: 'Visão',
    items: [
      { label: 'Início', href: '/dashboard', keywords: 'home resumo' },
      { label: 'Extrato', href: '/dashboard/extrato', keywords: 'movimentacoes' },
    ],
  },
  {
    group: 'Receber',
    items: [
      { label: 'Cobranças (PIX)', href: '/dashboard/pix', keywords: 'qr receber real' },
      { label: 'Links de pagamento', href: '/dashboard/links', keywords: 'link cobrar' },
    ],
  },
  {
    group: 'Guarani',
    items: [
      { label: 'Converter para Guarani', href: '/dashboard/conversao', keywords: 'cambio pyg guarani real converter' },
      { label: 'Enviar dinheiro', href: '/dashboard/enviar', keywords: 'pagar fornecedor payout' },
    ],
  },
  {
    group: 'Conta',
    items: [
      { label: 'Saldos', href: '/dashboard/contas', keywords: 'saldo carteira real guarani' },
      { label: 'Equipe & Dispositivos', href: '/dashboard/equipe', keywords: 'vendedores terminais convite' },
      { label: 'Verificação (KYC)', href: '/dashboard/kyc', keywords: 'documentos' },
      { label: 'Configurações', href: '/dashboard/config', keywords: 'perfil' },
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
      <Sidebar brandName="Finance Wirex" brandSub="powered by Core" markChar="W" markColor="#04201c" groups={GROUPS} />
      <main style={{ minWidth: 0, padding: '22px 24px 60px', maxWidth: 1240 }}>{children}</main>
    </div>
  )
}
