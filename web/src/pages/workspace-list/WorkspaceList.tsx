import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack } from '@thedatablitz/stack'
import type { ApiWorkspace } from '../../types/workspace'
import {
  WorkspaceListCardGrid,
  WorkspaceListFilters,
  WorkspaceListHero,
  WorkspacePageChrome,
} from './components'
import { useWorkspaceList } from './hooks'
import {
  type ProtocolFilterId,
  type WorkspaceListRow,
} from './workspaceListData'
import { ProjectIntelBitBar } from '../project-detail/components/ProjectIntelBitBar'

export type WorkspaceListProps = {
  rows?: WorkspaceListRow[]
  onSelectWorkspace?: (workspace: ApiWorkspace) => void
  onAddWorkspace?: () => void
}

export function WorkspaceList({
  rows: rowsProp,
  onSelectWorkspace,
  onAddWorkspace,
}: WorkspaceListProps) {
  const navigate = useNavigate()
  const { rows: apiRows } = useWorkspaceList()
  const rows = rowsProp ?? apiRows
  const [filter, setFilter] = useState<ProtocolFilterId>('all')
  const [query, setQuery] = useState('')

  const handleSelectWorkspace = (workspace: ApiWorkspace) => {
    onSelectWorkspace?.(workspace)
    const segment = encodeURIComponent(workspace.slug || workspace.id)
    navigate(`/projects/${segment}`)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (filter !== 'all' && row.protocol !== filter) return false
      if (!q) return true
      return (
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q)
      )
    })
  }, [rows, filter, query])

  const aiWorkspace = filtered[0] ?? null

  return (
    <WorkspacePageChrome>
      <div style={{ flex: 1, width: '100%' }}>
        <Stack gap="600" fullWidth>
          <WorkspaceListHero />
          <WorkspaceListFilters
            filter={filter}
            onFilterChange={setFilter}
            query={query}
            onQueryChange={setQuery}
          />
          <WorkspaceListCardGrid
            rows={filtered}
            onSelectWorkspace={handleSelectWorkspace}
            onAddWorkspace={onAddWorkspace}
          />
        </Stack>
      </div>
      <ProjectIntelBitBar
        title="INTELLEBIT"
        subtitle="Ask questions about your workspace and projects"
        ctaLabel="Ask Intellebit"
        workspaceId={aiWorkspace?.id}
        workspaceName={aiWorkspace?.name}
        allowOpenWithoutContext
      />
    </WorkspacePageChrome>
  )
}
