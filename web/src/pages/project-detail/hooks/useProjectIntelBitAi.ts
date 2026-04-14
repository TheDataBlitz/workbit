import { useMutation } from '@tanstack/react-query'
import { postAI, type AiChatTurn } from '../../../api'

export function useProjectIntelBitAi() {
  return useMutation({
    mutationFn: (vars: { messages: AiChatTurn[]; projectId: string }) =>
      postAI({ messages: vars.messages, projectId: vars.projectId }),
    onError: (e) => console.error(e, 'projectDetail.intellebit.postAI'),
  })
}
