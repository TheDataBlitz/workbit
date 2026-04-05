import { useQuery } from '@tanstack/react-query';
import {
  fetchProjectsForWorkspace,
  type ApiProjectSummary,
} from '../../../api/client';
import { workspaceProjectsQueryKey } from '../../../utils/workspaceQueryKeys';

type Params = {
  workspaceId: string | null;
  memberId: string | null;
  enabled: boolean;
};

export function useWorkspaceProjects({
  workspaceId,
  memberId,
  enabled,
}: Params) {
  return useQuery({
    queryKey:
      workspaceId && memberId
        ? workspaceProjectsQueryKey(workspaceId, memberId)
        : ['workspace', 'projects', 'idle'],
    queryFn: (): Promise<ApiProjectSummary[]> => {
      if (!workspaceId || !memberId) {
        return Promise.resolve([]);
      }
      return fetchProjectsForWorkspace(workspaceId, memberId);
    },
    enabled: Boolean(enabled && workspaceId && memberId),
  });
}
