export type AuthTokens = {
  access_token: string
  refresh_token?: string
  expires_at?: number
}

const LS_ACCESS = 'workbit.access_token'
const LS_REFRESH = 'workbit.refresh_token'
const LS_EXPIRES_AT = 'workbit.expires_at'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = window.localStorage.getItem(LS_ACCESS)
  return token && token.trim() ? token : null
}

export function setAuthTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(LS_ACCESS, tokens.access_token)
  if (typeof tokens.refresh_token === 'string') {
    window.localStorage.setItem(LS_REFRESH, tokens.refresh_token)
  }
  if (typeof tokens.expires_at === 'number') {
    window.localStorage.setItem(LS_EXPIRES_AT, String(tokens.expires_at))
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LS_ACCESS)
  window.localStorage.removeItem(LS_REFRESH)
  window.localStorage.removeItem(LS_EXPIRES_AT)
}
