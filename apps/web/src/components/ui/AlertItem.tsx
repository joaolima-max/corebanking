import { XCircle, AlertTriangle, Info } from 'lucide-react'

interface AlertItemProps {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  timestamp: string
}

const SEVERITY_CONFIG = {
  critical: {
    icon: <XCircle size={18} />,
    iconClass: 'text-red-500',
    bgClass: 'bg-red-50 border-red-200',
    badgeClass: 'bg-red-100 text-red-700',
    label: 'Crítico',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    iconClass: 'text-amber-500',
    bgClass: 'bg-amber-50 border-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700',
    label: 'Aviso',
  },
  info: {
    icon: <Info size={18} />,
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-50 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
    label: 'Info',
  },
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `há ${diffMins}min`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `há ${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  return `há ${diffDays}d`
}

export default function AlertItem({ id: _id, severity, title, description, timestamp }: AlertItemProps) {
  const config = SEVERITY_CONFIG[severity]

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgClass}`}>
      <span className={`mt-0.5 flex-shrink-0 ${config.iconClass}`}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeClass}`}>
            {config.label}
          </span>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
        </div>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <span className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
        {formatRelativeTime(timestamp)}
      </span>
    </div>
  )
}
