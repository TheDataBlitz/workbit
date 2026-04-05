import { getAccessToken } from '../pages/auth/supabaseClient';

let cachedBase: string | null = null;

function getApiBase(): string {
  if (cachedBase) {
    return cachedBase;
  }
  const apiUrl = String(process.env.VITE_API_URL ?? '')
    .trim()
    .replace(/\/$/, '');
  if (!apiUrl) {
    throw new Error(
      'API URL not configured. Set VITE_API_URL in mobile/.env (e.g. http://10.0.2.2:3001 for Android emulator, or your machine IP for a device).',
    );
  }
  cachedBase = `${apiUrl}/api/v1`;
  return cachedBase;
}

export async function authFetch(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const token = await getAccessToken();
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers ?? {}) as Record<string, string>),
    },
  });
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
