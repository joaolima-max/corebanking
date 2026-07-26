'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export interface NavItem { label: string; href: string; tag?: string }

export function Sidebar({
  brandName, brandSub, envLabel, markChar, markColor, nav,
}: {
  brandName: string; brandSub: string; envLabel: string
  markChar: string; markColor: string; nav: NavItem[]
}) {
  const pathname = usePathname()
  const { email, logout } = useAuth()
  return (
    <aside style={{ borderRight: '1px solid var(--border-soft)', background: 'var(--surface)', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 18px 6px' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 800, color: markColor, background: 'linear-gradient(150deg,var(--accent),var(--accent-2))' }}>{markChar}</div>
        <div><b style={{ fontSize: 15 }}>{brandName}</b><span style={{ display: 'block', fontSize: 11, color: 'var(--text-3)' }}>{brandSub}</span></div>
      </div>
      <div className="chip acc" style={{ margin: '8px 18px', width: 'max-content', textTransform: 'uppercase', letterSpacing: '.06em' }}>{envLabel}</div>
      <nav style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map((n) => {
          const active = pathname === n.href
          return (
            <Link key={n.href} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', color: active ? 'var(--text)' : 'var(--text-2)', background: active ? 'var(--accent-dim)' : 'transparent' }}>
              {n.label}
              {n.tag && <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>{n.tag}</span>}
            </Link>
          )
        })}
      </nav>
      <div style={{ marginTop: 'auto', padding: 14, borderTop: '1px solid var(--border-soft)', fontSize: 11, color: 'var(--text-3)' }}>
        <div style={{ color: 'var(--text-2)', fontSize: 12, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
        <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={logout}>Sair</button>
      </div>
    </aside>
  )
}
