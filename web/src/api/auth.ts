import { apiFetch } from './client'
import type { AuthTokens } from './authStore'

export type ApiLoginResponse = AuthTokens & {
  user: { id: string; email?: string }
}

export async function login(params: {
  email: string
  password: string
}): Promise<ApiLoginResponse> {
  return apiFetch<ApiLoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}
