import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postAI, postAIStreaming, type AiChatTurn } from '../../../api'
import { ApiHttpError } from '../../../api/client'

export function useProjectIntelBitAi() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vars: {
      messages: AiChatTurn[]
      projectId?: string
      workspaceId?: string
      onThinkingDelta?: (delta: string) => void
    }) => {
      const body = {
        messages: vars.messages,
        projectId: vars.projectId,
        workspaceId: vars.workspaceId,
      }

      // If streaming is enabled, we stream "thinking" into the UI panel,
      // but keep the final chat reply identical to the existing behavior
      // by fetching the non-streaming result afterward.
      if (vars.onThinkingDelta) {
        return postAIStreaming(body, { onDelta: vars.onThinkingDelta }).then(() =>
          postAI(body)
        )
      }

      return postAI(body)
    },
    onSuccess: async (_data, vars) => {
      // MCP/AI side-effects happen server-side. Ensure the UI refreshes whatever
      // the current screen might be showing.
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] })

      if (vars.workspaceId?.trim()) {
        const workspaceId = vars.workspaceId.trim()
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['workspace', 'projects'] }),
          queryClient.invalidateQueries({
            queryKey: ['workspace', 'projects', { workspaceId }],
          }),
          queryClient.invalidateQueries({
            queryKey: ['workspace', 'members', { workspaceId }],
          }),
          queryClient.invalidateQueries({
            queryKey: ['workspaces', 'mcp-tools', { workspaceId }],
          }),
        ])
      }

      if (vars.projectId?.trim()) {
        const projectId = vars.projectId.trim()
        // Partial key invalidation refreshes summary + properties + issues +
        // decisions + updates + documents, etc.
        await queryClient.invalidateQueries({ queryKey: ['projects', projectId] })
      }
    },
    onError: (e) => {
      if (e instanceof ApiHttpError && e.status === 401) {
        // Token expired / unauthorized: force re-auth.
        window.location.assign('/')
        return
      }
      console.error(e, 'projectDetail.intellebit.postAI')
    },
  })
}
