'use client'

import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
  prepared?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const VARIANT_STYLES = {
  default: 'border-slate-200',
  success: 'border-emerald-200 bg-emerald-50',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  loading = false,
  prepared = false,
  size = 'md',
}: MetricCardProps) {
  const paddingClass = size === 'sm' ? 'p-4' : size === 'lg' ? 'p-6' : 'p-5'
  const valueClass = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl'

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-slate-200 shadow-sm ${paddingClass} animate-pulse`}>
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
        <div className="h-8 bg-slate-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-slate-200 rounded w-1/3" />
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${paddingClass} ${VARIANT_STYLES[variant]}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="flex items-center gap-2">
          {prepared && (
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">
              Preparado
            </span>
          )}
          {icon && <span className="text-slate-400">{icon}</span>}
        </div>
      </div>
      <p className={`font-bold text-slate-900 ${valueClass} leading-tight`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {trend.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
          <span className="text-slate-400 font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
