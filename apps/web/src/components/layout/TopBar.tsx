'use client'

import { usePathname } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Executivo',
  '/dashboard/operations': 'Operações',
  '/dashboard/ledger': 'Ledger Contábil',
  '/dashboard/treasury': 'Tesouraria',
  '/dashboard/risk': 'Gestão de Risco',
  '/dashboard/pix': 'PIX',
  '/dashboard/acquiring': 'Adquirência',
  '/dashboard/observability': 'Observabilidade',
  '/dashboard/alerts': 'Central de Alertas',
  '/dashboard/accounts': 'Contas Operacionais',
}

export default function TopBar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()

  const title = PAGE_TITLES[pathname] || 'Dashboard'
  const env = process.env.NEXT_PUBLIC_ENV || 'PRODUCTION'

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="h-15 bg-white border-b border-slate-200 flex items-center justify-between px-6" style={{ height: '60px' }}>
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          env === 'PRODUCTION'
            ? 'bg-red-50 text-red-600 border border-red-200'
            : 'bg-amber-50 text-amber-600 border border-amber-200'
        }`}>
          {env}
        </span>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="w-8 h-8 bg-bass-100 rounded-full flex items-center justify-center">
            <User size={14} className="text-bass-600" />
          </div>
          <span className="hidden md:block">{user?.email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden md:block">Sair</span>
        </button>
      </div>
    </header>
  )
}
