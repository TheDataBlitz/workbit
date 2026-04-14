import type { WorkspaceListRow } from './workspaceListData'

export function protocolLabel(protocol: WorkspaceListRow['protocol']) {
  return `PRTCL // ${protocol}`
}
