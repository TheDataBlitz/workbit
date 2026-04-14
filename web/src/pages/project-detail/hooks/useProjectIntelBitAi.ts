import { useMutation } from '@tanstack/react-query'
import { postAI, type AiChatTurn } from '../../../api'
import { ApiHttpError } from '../../../api/client'

export function useProjectIntelBitAi() {
  return useMutation({
    mutationFn: (vars: { messages: AiChatTurn[]; projectId: string }) =>
      postAI({ messages: vars.messages, projectId: vars.projectId }),
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
