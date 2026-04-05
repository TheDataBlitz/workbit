export const workspaceMembersQueryKeyRoot = ['workspace-members'] as const;

export function workspaceMembersQueryKey(userId: string | null) {
  return [...workspaceMembersQueryKeyRoot, userId] as const;
}

export const workspacesListQueryKeyPrefix = ['workspaces', 'list'] as const;

export const workspaceProjectsQueryKeyRoot = ['workspace', 'projects'] as const;

export function workspaceProjectsQueryKey(
  workspaceId: string,
  memberId: string,
) {
  return [...workspaceProjectsQueryKeyRoot, workspaceId, memberId] as const;
}

export const teamProjectIssuesQueryKeyRoot = [
  'team',
  'project-issues',
] as const;

export function teamProjectIssuesQueryKey(
  teamId: string,
  projectId: string,
  filter: 'all' | 'active' | 'backlog',
) {
  return [...teamProjectIssuesQueryKeyRoot, teamId, projectId, filter] as const;
}
