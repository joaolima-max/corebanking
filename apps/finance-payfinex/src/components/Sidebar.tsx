'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'

export interface NavItem { label: string; href: string; tag?: string; keywords?: string }
export interface NavGroup { group: string; items: NavItem[] }

export function Sidebar({
  brandName, brandSub, markChar, markColor, groups,
}: {
  brandName: string; brandSub: string; markChar: string; markColor: string; groups: NavGroup[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { email, logout } = useAuth()
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!query) return groups
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => (`${it.label} ${it.keywords ?? ''} ${g.group}`).toLowerCase().includes(query)) }))
      .filter((g) => g.items.length)
  }, [groups, query])

  const flat = filtered.flatMap((g) => g.items)

  function onSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && flat[0]) { router.push(flat[0].href); setQ('') }
  }

  return (
    <aside style={{ borderRight: '1px solid var(--border-soft)', background: 'var(--surface)', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '18px 18px 12px' }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', fontWeight: 800, color: markColor, background: 'linear-gradient(150deg,var(--accent),var(--accent-2))' }}>{markChar}</div>
        <div><b style={{ fontSize: 15 }}>{brandName}</b><span style={{ display: 'block', fontSize: 11, color: 'var(--text-3)' }}>{brandSub}</span></div>
      </div>

      <div style={{ padding: '0 12px 8px' }}>
        <input
          className="input"
          placeholder="Buscar funcionalidade…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onSearchKey}
          style={{ padding: '8px 10px', fontSize: 12.5 }}
          aria-label="Buscar funcionalidade"
        />
      </div>

      <nav style={{ padding: '2px 10px 20px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {filtered.map((g) => (
          <div key={g.group}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.09em', color: 'var(--text-3)', padding: '14px 10px 6px' }}>{g.group}</div>
            {g.items.map((n) => {
              const active = pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href))
              return (
                <Link key={n.href} href={n.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none', color: active ? 'var(--text)' : 'var(--text-2)', background: active ? 'var(--accent-dim)' : 'transparent' }}>
                  {n.label}
                  {n.tag && <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 20, background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>{n.tag}</span>}
                </Link>
              )
            })}
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 12, color: 'var(--text-3)', fontSize: 12.5 }}>Nada encontrado.</div>}
      </nav>

      <div style={{ padding: 14, borderTop: '1px solid var(--border-soft)', fontSize: 11, color: 'var(--text-3)' }}>
        <div style={{ color: 'var(--text-2)', fontSize: 12, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
        <button className="btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={logout}>Sair</button>
      </div>
    </aside>
  )
}
