'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  TrendingUp,
  Activity,
  BookOpen,
  Zap,
  CreditCard,
  Banknote,
  Shield,
  Monitor,
  Bell,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
}

interface NavSection {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'FINANCEIRO',
    items: [
      { label: 'Executivo', href: '/dashboard', icon: <TrendingUp size={16} /> },
      { label: 'Operações', href: '/dashboard/operations', icon: <Activity size={16} /> },
      { label: 'Ledger', href: '/dashboard/ledger', icon: <BookOpen size={16} /> },
    ],
  },
  {
    title: 'PRODUTO',
    items: [
      { label: 'PIX', href: '/dashboard/pix', icon: <Zap size={16} />, badge: 'Em Breve' },
      { label: 'Adquirência', href: '/dashboard/acquiring', icon: <CreditCard size={16} />, badge: 'Em Breve' },
    ],
  },
  {
    title: 'GESTÃO',
    items: [
      { label: 'Tesouraria', href: '/dashboard/treasury', icon: <Banknote size={16} />, badge: 'Preparado' },
      { label: 'Risco', href: '/dashboard/risk', icon: <Shield size={16} />, badge: 'Preparado' },
    ],
  },
  {
    title: 'SISTEMA',
    items: [
      { label: 'Observabilidade', href: '/dashboard/observability', icon: <Monitor size={16} /> },
      { label: 'Alertas', href: '/dashboard/alerts', icon: <Bell size={16} /> },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const getBadgeStyle = (badge?: string) => {
    if (!badge) return ''
    if (badge === 'Em Breve') return 'bg-blue-100 text-blue-600'
    if (badge === 'Preparado') return 'bg-purple-100 text-purple-600'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <aside aria-label="Navegação principal" className="w-60 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-15 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#00B37E' }}>
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <span className="font-bold text-xl" style={{ color: '#00B37E' }}>Bass</span>
        <span className="text-xs text-slate-400 ml-1 mt-1">Core</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {section.title}
            </p>
            {section.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-bass-50 text-bass-600 border-l-2 border-bass-500 pl-3.5'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={active ? 'text-bass-500' : 'text-slate-400'}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getBadgeStyle(item.badge)}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200">
        <p className="text-xs text-slate-400">Bass Financial Core v1.0</p>
      </div>
    </aside>
  )
}
