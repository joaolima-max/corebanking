'use client'

import { ReactNode, useState, useId } from 'react'

/* ---------- charts ---------- */
export function AreaChart({ data, height = 130, color = 'var(--accent)' }: { data: number[]; height?: number; color?: string }) {
  const id = useId().replace(/:/g, '')
  const w = 600, pad = 6
  const max = Math.max(...data, 1) * 1.15
  const n = data.length
  const X = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(n - 1, 1)
  const Y = (v: number) => height - 6 - (v / max) * (height - 22)
  let top = `M ${X(0)} ${Y(data[0] ?? 0)}`
  data.forEach((v, i) => { if (i) top += ` L ${X(i)} ${Y(v)}` })
  const fill = `${top} L ${X(n - 1)} ${height} L ${X(0)} ${height} Z`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height, display: 'block' }}>
      <defs>
        <linearGradient id={`ac${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map((g) => <line key={g} x1="0" x2={w} y1={6 + (g * (height - 22)) / 2} y2={6 + (g * (height - 22)) / 2} stroke="var(--border-soft)" />)}
      <path d={fill} fill={`url(#ac${id})`} />
      <path d={top} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <circle cx={X(n - 1)} cy={Y(data[n - 1] ?? 0)} r={3.5} fill={color} />
    </svg>
  )
}

export function Bars({ data, height = 130, color = 'var(--accent)' }: { data: number[]; height?: number; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, background: color, opacity: 0.35 + 0.65 * (v / max), borderRadius: '3px 3px 0 0', minHeight: 2 }} />
      ))}
    </div>
  )
}

/* ---------- data helpers ---------- */
// The API wraps lists in various shapes; normalize to an array.
export function asArray<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>
    if (Array.isArray(d.items)) return d.items as T[]
    if (Array.isArray(d.data)) return d.data as T[]
    if (Array.isArray(d.results)) return d.results as T[]
  }
  return []
}

/* ---------- layout primitives ---------- */
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
      <div>
        <h1 style={{ fontSize: 21, margin: '0 0 3px', letterSpacing: '-0.025em' }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, color: 'var(--text-3)', fontSize: 13 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, pad = 18, style }: { children: ReactNode; pad?: number; style?: React.CSSProperties }) {
  return <div className="card" style={{ padding: pad, ...style }}>{children}</div>
}

export function SectionTitle({ children, badge }: { children: ReactNode; badge?: ReactNode }) {
  return (
    <h3 style={{ margin: '0 0 12px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}{badge}
    </h3>
  )
}

export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 14 }}>{children}</div>
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'accent' | 'pos' | 'neg' | 'muted' | 'warn' }) {
  const color = tone === 'pos' ? 'var(--pos)' : tone === 'neg' ? 'var(--neg)' : tone === 'warn' ? 'var(--warn)' : tone === 'muted' ? 'var(--text-3)' : 'var(--accent)'
  return (
    <div className="card" style={{ padding: '15px 16px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{label}</div>
      <div className="num" style={{ fontSize: 22, fontWeight: 650, margin: '8px 0 5px', letterSpacing: '-0.03em' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color }}>{sub}</div>}
    </div>
  )
}

export function Chip({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'pos' | 'neg' | 'acc' | 'warn' }) {
  const map: Record<string, React.CSSProperties> = {
    default: {},
    pos: { color: 'var(--pos)', background: 'var(--pos-dim)', borderColor: 'transparent' },
    neg: { color: 'var(--neg)', background: 'var(--neg-dim)', borderColor: 'transparent' },
    warn: { color: 'var(--warn)', background: 'rgba(227,160,8,.14)', borderColor: 'transparent' },
    acc: { color: 'var(--accent)', background: 'var(--accent-dim)', borderColor: 'var(--accent-line)' },
  }
  return <span className="chip" style={map[tone]}>{children}</span>
}

/* ---------- table ---------- */
export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  align?: 'left' | 'right'
  mono?: boolean
  width?: string
}

export function DataTable<T>({ columns, rows, loading, error, emptyText = 'Nenhum registro.' }: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  error?: unknown
  emptyText?: string
}) {
  if (loading) return <State kind="loading" />
  if (error) return <State kind="error" text={error instanceof Error ? error.message : 'Falha ao carregar.'} />
  if (!rows.length) return <State kind="empty" text={emptyText} />
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align ?? 'left', color: 'var(--text-3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em', padding: '0 12px 10px', borderBottom: '1px solid var(--border-soft)', width: c.width }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key} className={c.mono ? 'num' : undefined} style={{ padding: '11px 12px', borderBottom: '1px solid var(--border-soft)', textAlign: c.align ?? 'left', whiteSpace: c.align === 'right' ? 'nowrap' : undefined }}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function State({ kind, text }: { kind: 'loading' | 'empty' | 'error'; text?: string }) {
  const color = kind === 'error' ? 'var(--neg)' : 'var(--text-3)'
  const label = text ?? (kind === 'loading' ? 'Carregando…' : kind === 'empty' ? 'Sem dados.' : 'Erro.')
  return <div style={{ padding: '24px 4px', color, fontSize: 13, textAlign: 'center' }}>{label}</div>
}

export function Field({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{k}</div>
      <div className={mono ? 'num' : undefined} style={{ fontSize: 13, marginTop: 3 }}>{v}</div>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-soft)', marginBottom: 16, overflowX: 'auto' }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            border: 0, background: 'transparent', cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 600,
            padding: '9px 12px', color: active === t.key ? 'var(--text)' : 'var(--text-3)',
            borderBottom: active === t.key ? '2px solid var(--accent)' : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Non-dead action button: performs `onClick` if given, else shows an inline "em breve" note. */
export function Soon({ label, note }: { label: string; note?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button className="btn" onClick={() => setOpen((o) => !o)}>{label}</button>
      {open && (
        <span role="status" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 10, background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 11px', fontSize: 11.5, color: 'var(--text-2)', width: 240, boxShadow: '0 10px 30px -10px #000' }}>
          {note ?? 'Em breve — ação será ligada à API nesta fase.'}
        </span>
      )}
    </span>
  )
}
