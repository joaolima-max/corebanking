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
      { label: 'Extrato', href: '/dashboard/extrato', keywords: 'lançamentos ledger' },
    ],
  },
  {
    group: 'Receber',
    items: [
      { label: 'Cobranças (PIX)', href: '/dashboard/pix', keywords: 'qr chave receber' },
      { label: 'Links de pagamento', href: '/dashboard/links', keywords: 'link checkout' },
    ],
  },
  {
    group: 'Enviar & Converter',
    items: [
      { label: 'Enviar dinheiro', href: '/dashboard/enviar', keywords: 'payout transferencia' },
      { label: 'Conversão & FX', href: '/dashboard/conversao', keywords: 'cambio stablecoin' },
    ],
  },
  {
    group: 'Conta',
    items: [
      { label: 'Saldos & Wallets', href: '/dashboard/contas', keywords: 'saldo carteira' },
      { label: 'Equipe & Dispositivos', href: '/dashboard/equipe', keywords: 'convite usuarios terminais vendedores autorizar' },
      { label: 'Verificação (KYC)', href: '/dashboard/kyc', keywords: 'documentos' },
      { label: 'Configurações', href: '/dashboard/config', keywords: 'branding tarifas 2fa senha' },
      { label: 'Minha conta', href: '/dashboard/conta', keywords: 'perfil' },
    ],
  },
  {
    group: 'Integração',
    items: [
      { label: 'Developers', href: '/dashboard/developers', keywords: 'api keys' },
      { label: 'Webhooks', href: '/dashboard/webhooks', keywords: 'reenvio falha eventos' },
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
      <Sidebar brandName="Aurora Pay" brandSub="powered by Bass" markChar="A" markColor="#07120e" groups={GROUPS} />
      <main style={{ minWidth: 0, padding: '22px 24px 60px', maxWidth: 1240 }}>{children}</main>
    </div>
  )
}
