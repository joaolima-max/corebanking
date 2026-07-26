'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { useAuth } from './auth'

export interface Me {
  id: string
  email: string
  fullName: string
  orgId: string
  status?: string
  roles: string[]
  permissions?: string[]
}

export function useMe() {
  const { token } = useAuth()
  return useQuery({ queryKey: ['me'], queryFn: () => api.get<Me>('/api/v1/auth/me', token!), enabled: !!token })
}

export function useApi<T>(key: unknown[], path: string | null) {
  const { token } = useAuth()
  return useQuery({
    queryKey: key,
    queryFn: () => api.get<T>(path as string, token!),
    enabled: !!token && !!path,
  })
}
