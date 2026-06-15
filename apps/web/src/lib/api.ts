const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Single-flight 401 guard — prevents thundering herd when token expires
let isRedirecting = false
type UnauthorizedHandler = () => void
let unauthorizedHandler: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(fn: UnauthorizedHandler) {
  unauthorizedHandler = fn
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 401) {
    if (!isRedirecting) {
      isRedirecting = true
      if (unauthorizedHandler) {
        unauthorizedHandler()
      } else if (typeof window !== 'undefined') {
        localStorage.removeItem('bass_token')
        localStorage.removeItem('bass_user_email')
        window.location.href = '/login'
      }
      setTimeout(() => { isRedirecting = false }, 3000)
    }
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.')
  }

  if (res.status === 403) {
    throw new ApiError(403, 'Acesso negado.')
  }

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After')
    const msg = retryAfter
      ? `Muitas tentativas. Tente novamente em ${retryAfter}s.`
      : 'Muitas tentativas. Tente novamente em instantes.'
    throw new ApiError(429, msg)
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    const message = typeof body?.message === 'string' ? body.message : `Erro ${res.status}`
    const code = typeof body?.error === 'string' ? body.error : undefined
    throw new ApiError(res.status, message, code)
  }

  const body = await res.json() as Record<string, unknown>
  return (body?.data !== undefined ? body.data : body) as T
}

export const api = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  post: <T>(path: string, data: unknown, token?: string) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
}
