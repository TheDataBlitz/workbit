import { useQuery } from '@tanstack/react-query';
import {
  fetchTeamProjectIssues,
  type ApiTeamProjectIssue,
} from '../../../api/client';
import { teamProjectIssuesQueryKey } from '../../../utils/workspaceQueryKeys';

type Params = {
  teamId: string;
  projectId: string;
  /** When false, no request (e.g. accordion closed and panel unmounted — usually always true). */
  enabled?: boolean;
  filter?: 'all' | 'active' | 'backlog';
};

export function useProjectIssues({
  teamId,
  projectId,
  enabled = true,
  filter = 'all',
}: Params) {
  return useQuery({
    queryKey: teamProjectIssuesQueryKey(teamId, projectId, filter),
    queryFn: (): Promise<ApiTeamProjectIssue[]> =>
      fetchTeamProjectIssues(teamId, filter, projectId),
    enabled: Boolean(enabled && teamId && projectId),
  });
}
