import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import {
  disableProjectAgentForProject,
  enableProjectAgentForProject,
  fetchAgentCatalog,
  fetchProjectEnabledAgents,
  fetchProjects,
  fetchWorkspaceMcpTools,
  setWorkspaceMcpTool,
  testWorkspaceMcpTool,
} from '../../api/client'
import { logError } from '../../utils/errorHandling'

function useWorkspaceMcpToolsQuery(wid: string) {
  return useQuery({
    queryKey: ['workspace', wid, 'mcp-tools'],
    queryFn: () => fetchWorkspaceMcpTools(wid),
    enabled: Boolean(wid),
  })
}

function useWorkspaceProjectsQuery(wid: string) {
  return useQuery({
    queryKey: ['workspace', wid, 'projects'],
    queryFn: () => fetchProjects(),
    enabled: Boolean(wid),
  })
}

function useAgentCatalogQuery(wid: string) {
  return useQuery({
    queryKey: ['agents', 'catalog'],
    queryFn: () => fetchAgentCatalog(),
    enabled: Boolean(wid),
  })
}

function useProjectEnabledAgentsQuery(wid: string, selectedProjectId: string) {
  return useQuery({
    queryKey: ['project', selectedProjectId, 'agents', 'enabled'],
    queryFn: () => fetchProjectEnabledAgents(selectedProjectId),
    enabled: Boolean(wid && selectedProjectId),
  })
}

function useWorkspaceMcpToolMutations(wid: string) {
  const queryClient = useQueryClient()

  const setMutation = useMutation({
    mutationFn: (input: { toolKey: string; enabled: boolean }) =>
      setWorkspaceMcpTool(wid, input.toolKey, {
        enabled: input.enabled,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['workspace', wid, 'mcp-tools'],
      })
    },
  })

  const testMutation = useMutation({
    mutationFn: (input: { toolKey: string; baseUrl: string }) =>
      testWorkspaceMcpTool(wid, input.toolKey, {
        baseUrl: input.baseUrl,
      }),
  })

  return { setMutation, testMutation }
}

function useProjectAgentMutations() {
  const queryClient = useQueryClient()

  const enableAgentMutation = useMutation({
    mutationFn: (input: { projectId: string; agentKey: string }) =>
      enableProjectAgentForProject(input.projectId, input.agentKey),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: ['project', vars.projectId, 'agents', 'enabled'],
      })
    },
    onError: (e) => {
      logError(e, 'IntegrationBits.enableProjectAgent')
    },
  })

  const disableAgentMutation = useMutation({
    mutationFn: (input: { projectId: string; agentKey: string }) =>
      disableProjectAgentForProject(input.projectId, input.agentKey),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: ['project', vars.projectId, 'agents', 'enabled'],
      })
    },
    onError: (e) => {
      logError(e, 'IntegrationBits.disableProjectAgent')
    },
  })

  return { enableAgentMutation, disableAgentMutation }
}

export function useIntegrationBitsTabData(wid: string) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')

  const toolsQuery = useWorkspaceMcpToolsQuery(wid)
  const projectsQuery = useWorkspaceProjectsQuery(wid)
  const agentCatalogQuery = useAgentCatalogQuery(wid)
  const enabledAgentsQuery = useProjectEnabledAgentsQuery(
    wid,
    selectedProjectId
  )

  const { setMutation, testMutation } = useWorkspaceMcpToolMutations(wid)
  const { enableAgentMutation, disableAgentMutation } =
    useProjectAgentMutations()

  const items = toolsQuery.data?.tools ?? []
  const projectOptions = useMemo(
    () =>
      (projectsQuery.data ?? []).map((p) => ({
        value: p.id,
        label: p.name,
      })),
    [projectsQuery.data]
  )
  const catalogAgents = agentCatalogQuery.data?.agents ?? []
  const enabledSet = useMemo(() => {
    const keys = enabledAgentsQuery.data?.agents?.map((a) => a.agentKey) ?? []
    return new Set(keys)
  }, [enabledAgentsQuery.data?.agents])

  return {
    selectedProjectId,
    setSelectedProjectId,

    toolsQuery,
    items,
    setMutation,
    testMutation,

    projectsQuery,
    projectOptions,

    agentCatalogQuery,
    catalogAgents,
    enabledAgentsQuery,
    enabledSet,
    enableAgentMutation,
    disableAgentMutation,
  }
}
