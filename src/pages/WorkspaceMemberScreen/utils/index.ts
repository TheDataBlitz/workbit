import type { ApiMember } from '../../../api/client'
import type { MemberRow } from './createMembersColumn'
import { formatDateTime } from '../../../utils/format'

export function mapMembersToRows(members: ApiMember[]): MemberRow[] {
  return members.map((member) => ({
    id: member.id,
    name: member.name,
    username: member.username,
    avatarSrc: member.avatarSrc,
    status: member.status,
    joined: formatDateTime(member.joined),
    teams: member.teams ?? '—',
  }))
}
