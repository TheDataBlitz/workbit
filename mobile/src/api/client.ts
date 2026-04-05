import { getAccessToken } from '../pages/auth/supabaseClient';

function getApiBase(): string {
  const apiUrl = String(process.env.VITE_API_URL ?? '')
    .trim()
    .replace(/\/$/, '');
  if (!apiUrl) {
    throw new Error(
      'API URL not configured. Set VITE_API_URL in mobile/.env (e.g. http://10.0.2.2:3001 for Android emulator, or your machine IP for a device).',
    );
  }
  return `${apiUrl}/api/v1`;
}

function apiOriginForLogs(): string {
  try {
    const base = getApiBase();
    return new URL(base.replace(/\/api\/v1\/?$/, '/')).origin;
  } catch {
    return '(invalid VITE_API_URL)';
  }
}

function mapNetworkFailure(err: unknown, path: string): Error {
  const msg = err instanceof Error ? err.message : String(err);
  const origin = apiOriginForLogs();
  const hints = [
    `Could not reach API at ${origin}`,
    'Use a URL your device can route to (LAN IP for a phone, http://10.0.2.2:3001 for Android emulator → host).',
    'Start the API with PORT=3001 and ensure it listens on all interfaces.',
  ];
  if (__DEV__) {
    console.warn('[workbit] fetch failed', { path, origin, cause: msg });
  }
  return new Error(`${msg}${__DEV__ ? `. ${hints.join(' ')}` : ''}`);
}

export async function authFetch(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const token = await getAccessToken();
  const url = `${getApiBase()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers ?? {}) as Record<string, string>),
      },
    });
  } catch (e) {
    throw mapNetworkFailure(e, path);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: string }).error || res.statusText;
    if (__DEV__) {
      console.warn('[workbit] API request failed', path, res.status, message);
    }
    throw new Error(message);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

export interface ApiWorkspace {
  id: string;
  name: string;
  slug: string;
  region: string;
}

export interface ApiMember {
  id: string;
  name: string;
  username: string;
  avatarSrc?: string;
  status: string;
  joined: string;
  provisioned: boolean;
  uid?: string | null;
  teams: string;
}

export async function fetchWorkspaces(
  memberId: string,
): Promise<ApiWorkspace[]> {
  return authFetch(
    `/workspaces?memberId=${encodeURIComponent(memberId)}`,
  ) as Promise<ApiWorkspace[]>;
}

export async function fetchMembers(): Promise<ApiMember[]> {
  return authFetch('/workspace/members') as Promise<ApiMember[]>;
}

/** Matches web `WorkspaceProjectsScreen` / GET /workspace/projects. */
export interface ApiProjectSummary {
  id: string;
  name: string;
  description: string;
  team: { id: string; name: string };
  status: string;
}

export async function fetchProjects(): Promise<ApiProjectSummary[]> {
  return authFetch('/workspace/projects') as Promise<ApiProjectSummary[]>;
}

export interface ApiWorkspaceTeam {
  id: string;
  name: string;
  memberCount: number;
  project: { id: string; name: string } | null;
}

export async function fetchWorkspaceTeams(
  workspaceId: string,
  memberId?: string,
): Promise<ApiWorkspaceTeam[]> {
  const params = new URLSearchParams({ workspaceId });
  if (memberId != null && memberId !== '') {
    params.set('memberId', memberId);
  }
  return authFetch(`/workspace/teams?${params.toString()}`) as Promise<
    ApiWorkspaceTeam[]
  >;
}

/** Projects whose team belongs to the workspace (same scoping as web workspace route). */
export async function fetchProjectsForWorkspace(
  workspaceId: string,
  memberId: string,
): Promise<ApiProjectSummary[]> {
  const [projects, teams] = await Promise.all([
    fetchProjects(),
    fetchWorkspaceTeams(workspaceId, memberId),
  ]);
  const teamIds = new Set(teams.map(t => t.id));
  return projects.filter(p => teamIds.has(p.team.id));
}

/** Same contract as web `fetchTeamProjectIssues` — GET /teams/:teamId/project/issues */
export interface ApiTeamProjectIssue {
  id: string;
  title: string;
  assignee: { id: string; name: string } | null;
  date: string;
  status: string;
  parentIssueId: string | null;
  subIssueCount: number;
}

export async function fetchTeamProjectIssues(
  teamId: string,
  filter: 'all' | 'active' | 'backlog' = 'all',
  projectId?: string,
): Promise<ApiTeamProjectIssue[]> {
  const params = new URLSearchParams({ filter });
  if (projectId != null && projectId.trim() !== '') {
    params.set('projectId', projectId.trim());
  }
  return authFetch(
    `/teams/${encodeURIComponent(teamId)}/project/issues?${params.toString()}`,
  ) as Promise<ApiTeamProjectIssue[]>;
}

/** Same as web `src/api/aiClient.ts` — POST /api/v1/ai */
export type AiChatTurn = {
  role: 'user' | 'assistant';
  content: string;
};

export async function postAiPrompt(
  body: { messages: AiChatTurn[] } | { prompt: string },
): Promise<{ reply: string }> {
  return authFetch('/ai', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as Promise<{ reply: string }>;
}
