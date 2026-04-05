export const workspaceMembersQueryKeyRoot = ['workspace-members'] as const;

export function workspaceMembersQueryKey(userId: string | null) {
  return [...workspaceMembersQueryKeyRoot, userId] as const;
}

export const workspacesListQueryKeyPrefix = ['workspaces', 'list'] as const;
