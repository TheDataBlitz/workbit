import { useMemo } from 'react'
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  fetchAgentCatalog,
  fetchProjectEnabledAgents,
  fetchWorkspaceProjects,
  fetchWorkspaceMcpTools,
  setProjectAgentEnabled,
  setWorkspaceMcpTool,
  type ApiAgentCatalogItem,
  type ApiProjectEnabledAgent,
  type ApiWorkspaceMcpTool,
} from '../../../api'

const LS_SELECTED_WORKSPACE = 'workbit.selected_workspace_id'

function safeGetSelectedWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(LS_SELECTED_WORKSPACE)
  return v && v.trim() ? v : null
}

export type ProjectAgentToggleRow = ApiAgentCatalogItem & {
  enabled: boolean
  enabledAt?: string
}

export function useIntellebitProjectAgentsAndTools() {
  const queryClient = useQueryClient()

  const selectedWorkspaceId = useMemo(() => safeGetSelectedWorkspaceId(), [])

  const projects = useQuery({
    queryKey: ['workspace', 'projects'],
    queryFn: fetchWorkspaceProjects,
  })

  const agentCatalog = useQuery({
    queryKey: ['agents', 'catalog'],
    queryFn: fetchAgentCatalog,
  })

  const workspaceTools = useQuery({
    queryKey: ['workspaces', 'mcp-tools', { workspaceId: selectedWorkspaceId }],
    enabled: Boolean(selectedWorkspaceId),
    queryFn: () => fetchWorkspaceMcpTools(selectedWorkspaceId!),
  })

  const projectAgentQueries = useQueries({
    queries: (projects.data ?? []).map((p) => ({
      queryKey: ['projects', p.id, 'enabled-agents'],
      queryFn: () => fetchProjectEnabledAgents(p.id),
      enabled: Boolean(p.id),
    })),
  })

  const enabledAgentsByProjectId = useMemo(() => {
    const out = new Map<string, ApiProjectEnabledAgent[]>()
    const ps = projects.data ?? []
    for (let i = 0; i < ps.length; i++) {
      const proj = ps[i]
      const q = projectAgentQueries[i]
      if (proj?.id && q?.data) out.set(proj.id, q.data)
    }
    return out
  }, [projectAgentQueries, projects.data])

  const agentTogglesByProjectId = useMemo(() => {
    const catalog = agentCatalog.data ?? []
    const ps = projects.data ?? []
    const out = new Map<string, ProjectAgentToggleRow[]>()

    for (const p of ps) {
      const enabled = enabledAgentsByProjectId.get(p.id) ?? []
      const enabledMap = new Map(enabled.map((e) => [e.agentKey, e]))
      out.set(
        p.id,
        catalog.map((c) => ({
          ...c,
          enabled: enabledMap.has(c.agentKey),
          enabledAt: enabledMap.get(c.agentKey)?.createdAt,
        }))
      )
    }
    return out
  }, [agentCatalog.data, enabledAgentsByProjectId, projects.data])

  const setAgentEnabled = useMutation({
    mutationFn: setProjectAgentEnabled,
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: ['projects', vars.projectId, 'enabled-agents'],
      })
    },
    onError: (err) => console.error(err, 'settings.intellebit.setAgentEnabled'),
  })

  const setToolEnabled = useMutation({
    mutationFn: setWorkspaceMcpTool,
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: [
          'workspaces',
          'mcp-tools',
          { workspaceId: vars.workspaceId },
        ],
      })
    },
    onError: (err) => console.error(err, 'settings.intellebit.setToolEnabled'),
  })

  const isLoading =
    projects.isLoading ||
    agentCatalog.isLoading ||
    workspaceTools.isLoading ||
    projectAgentQueries.some((q) => q.isLoading) ||
    setAgentEnabled.isPending ||
    setToolEnabled.isPending

  const error =
    projects.error ||
    agentCatalog.error ||
    workspaceTools.error ||
    projectAgentQueries.find((q) => q.error)?.error ||
    setAgentEnabled.error ||
    setToolEnabled.error

  return {
    selectedWorkspaceId,
    projects,
    agentCatalog,
    workspaceTools,
    enabledAgentsByProjectId,
    agentTogglesByProjectId,
    isLoading,
    error,
    actions: {
      setAgentEnabled: (input: {
        projectId: string
        agentKey: string
        enabled: boolean
      }) => setAgentEnabled.mutateAsync(input),
      setToolEnabled: (input: {
        workspaceId: string
        toolKey: string
        enabled: boolean
        baseUrl?: string | null
        token?: string | null
      }) => setToolEnabled.mutateAsync(input),
    },
  }
}

export type { ApiWorkspaceMcpTool }
