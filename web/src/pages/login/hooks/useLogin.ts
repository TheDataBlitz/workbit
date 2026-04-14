import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, setAuthTokens } from '../../../api'

export function useLogin() {
  const qc = useQueryClient()

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuthTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
      })
      // Ensure post-login queries refetch with auth
      qc.invalidateQueries()
    },
  })

  return {
    login: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  }
}
