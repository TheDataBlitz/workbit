import { getAccessToken } from './authStore'

function getApiBase(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  if (typeof apiUrl === 'string' && apiUrl) {
    const base = apiUrl.replace(/\/$/, '')
    return `${base}/api/v1`
  }
  return '/api/v1'
}

const API_BASE = getApiBase()

export type ApiErrorPayload = { error?: string }

export class ApiHttpError extends Error {
  status: number
  payload?: ApiErrorPayload
  constructor(input: {
    status: number
    message: string
    payload?: ApiErrorPayload
  }) {
    super(input.message)
    this.name = 'ApiHttpError'
    this.status = input.status
    this.payload = input.payload
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as ApiErrorPayload
    throw new ApiHttpError({
      status: res.status,
      message: payload.error || res.statusText,
      payload,
    })
  }
  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}

export async function authFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as ApiErrorPayload
    throw new ApiHttpError({
      status: res.status,
      message: payload.error || res.statusText,
      payload,
    })
  }
  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}
