import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  disableProjectAgentForProject,
  enableProjectAgentForProject,
  fetchAgentCatalog,
  fetchProjectEnabledAgents,
} from '../../../api/client'
import { logError } from '../../../utils/errorHandling'

export const agentCatalogQueryKey = ['agents', 'catalog'] as const

export const projectEnabledAgentsQueryKey = (projectId: string) =>
  ['projects', projectId, 'agents'] as const

export function useProjectAgentsPanel(projectId: string | undefined) {
  const queryClient = useQueryClient()

  const catalogQuery = useQuery({
    queryKey: agentCatalogQueryKey,
    queryFn: fetchAgentCatalog,
  })

  const enabledQuery = useQuery({
    queryKey: projectEnabledAgentsQueryKey(projectId ?? '__none__'),
    queryFn: () => fetchProjectEnabledAgents(projectId!),
    enabled: Boolean(projectId),
  })

  const enabledKeys = useMemo(() => {
    const list = enabledQuery.data?.agents ?? []
    return new Set(list.map((a) => a.agentKey))
  }, [enabledQuery.data?.agents])

  const enableMutation = useMutation({
    mutationFn: (agentKey: string) =>
      enableProjectAgentForProject(projectId!, agentKey),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: projectEnabledAgentsQueryKey(projectId),
        })
      }
    },
    onError: (e) => logError(e, 'useProjectAgentsPanel.enable'),
  })

  const disableMutation = useMutation({
    mutationFn: (agentKey: string) =>
      disableProjectAgentForProject(projectId!, agentKey),
    onSuccess: () => {
      if (projectId) {
        void queryClient.invalidateQueries({
          queryKey: projectEnabledAgentsQueryKey(projectId),
        })
      }
    },
    onError: (e) => logError(e, 'useProjectAgentsPanel.disable'),
  })

  const busyAgentKey =
    enableMutation.isPending && enableMutation.variables != null
      ? enableMutation.variables
      : disableMutation.isPending && disableMutation.variables != null
        ? disableMutation.variables
        : null

  return {
    catalogAgents: catalogQuery.data?.agents ?? [],
    catalogLoading: catalogQuery.isPending,
    catalogError: catalogQuery.error,
    enabledKeys,
    enableAgent: enableMutation.mutate,
    disableAgent: disableMutation.mutate,
    busyAgentKey,
  }
}
