import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  fetchMembers,
  fetchWorkspaces,
  type ApiWorkspace,
} from '../../../api/client';
import {
  workspaceMembersQueryKey,
  workspacesListQueryKeyPrefix,
} from '../../../utils/workspaceQueryKeys';

type UseWorkspacesDataParams = {
  userId: string | null;
  authLoading: boolean;
};

type UseWorkspacesDataResult = {
  memberId: string | null;
  memberError: string | null;
  workspaces: ApiWorkspace[];
  workspacesLoading: boolean;
  workspacesError: string | null;
  reloadWorkspaces: () => Promise<void>;
};

export function useWorkspacesData({
  userId,
  authLoading,
}: UseWorkspacesDataParams): UseWorkspacesDataResult {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: workspaceMembersQueryKey(userId),
    queryFn: () => fetchMembers(),
    enabled: !authLoading && !!userId,
  });

  const currentMember = useMemo(() => {
    if (!membersQuery.data || !userId) {
      return undefined;
    }
    return membersQuery.data.find(
      member => member.uid && member.uid === userId,
    );
  }, [membersQuery.data, userId]);

  const memberId = currentMember?.id ?? null;

  const memberError = useMemo(() => {
    if (authLoading || !userId) {
      return null;
    }
    if (membersQuery.isError) {
      const e = membersQuery.error;
      return e instanceof Error
        ? e.message
        : 'Failed to resolve workspace member.';
    }
    if (membersQuery.isSuccess && !currentMember) {
      return 'No workspace member profile found for this account. Ask an admin to add you as a member.';
    }
    return null;
  }, [
    authLoading,
    userId,
    membersQuery.isError,
    membersQuery.error,
    membersQuery.isSuccess,
    currentMember,
  ]);

  const workspacesQuery = useQuery({
    queryKey: [...workspacesListQueryKeyPrefix, memberId],
    queryFn: ({ queryKey }) => {
      const id = queryKey[2];
      if (typeof id !== 'string') {
        throw new Error('Missing workspace member id.');
      }
      return fetchWorkspaces(id);
    },
    enabled: typeof memberId === 'string' && memberId.length > 0,
  });

  const workspacesLoading = Boolean(
    memberId && (workspacesQuery.isPending || workspacesQuery.isFetching),
  );

  const workspacesError = workspacesQuery.isError
    ? workspacesQuery.error instanceof Error
      ? workspacesQuery.error.message
      : 'Failed to load workspaces.'
    : null;

  const reloadWorkspaces = useCallback(async () => {
    if (!memberId) {
      return;
    }
    await queryClient.refetchQueries({
      queryKey: [...workspacesListQueryKeyPrefix, memberId],
    });
  }, [memberId, queryClient]);

  return {
    memberId,
    memberError,
    workspaces: workspacesQuery.data ?? [],
    workspacesLoading,
    workspacesError,
    reloadWorkspaces,
  };
}
