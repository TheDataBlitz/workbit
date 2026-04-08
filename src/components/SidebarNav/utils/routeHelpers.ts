import type { Team } from '../../../constants'

export function getActiveProfileTab(
  search: string
): 'profile' | 'api-keys' | 'usage' | 'integrationbits' {
  const tab = new URLSearchParams(search).get('tab')
  if (tab === 'profile') return 'profile'
  if (tab === 'usage') return 'usage'
  if (tab === 'integrationbits') return 'integrationbits'
  return 'api-keys'
}

export function isTeamIssues(base: string, teamId: string, pathname: string) {
  return (
    pathname === `${base}/team/${teamId}` ||
    pathname === `${base}/team/${teamId}/` ||
    pathname.startsWith(`${base}/team/${teamId}/issues`)
  )
}

export function isTeamProjects(base: string, teamId: string, pathname: string) {
  return pathname.startsWith(`${base}/team/${teamId}/projects`)
}

export function initExpandedTeams(teams: Team[]): Record<string, boolean> {
  return Object.fromEntries(teams.map((team) => [team.id, true]))
}

/** Tree node id for the expanded sidebar `Tree` (controlled selection). */
export function getSelectedNavTreeId(
  pathname: string,
  base: string,
  teams: Team[]
): string | null {
  if (pathname === `${base}/workspace/projects`) return 'ws-projects'
  if (pathname === `${base}/workspace/member`) return 'ws-members'
  if (pathname === `${base}/workspace/teams`) return 'ws-teams'
  for (const team of teams) {
    if (isTeamIssues(base, team.id, pathname)) return `team:${team.id}:i`
    if (isTeamProjects(base, team.id, pathname)) return `team:${team.id}:p`
  }
  return null
}
