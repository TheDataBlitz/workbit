import { Folder } from 'lucide-react'
import { Badge } from '@thedatablitz/badge'
import { Text } from '@thedatablitz/text'
import type { ColumnDef } from '@thedatablitz/table'

export type ProjectTableRow = {
  id: string
  name: string
  team: string
  status: string
}

export function createProjectColumn(): ColumnDef<ProjectTableRow, unknown>[] {
  return [
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Project',
      enableSorting: true,
      meta: { flex: 1.5 },
      cell: ({ row }) => (
        <>
          <Folder size={14} className="proj-icon" />
          <Text variant="body2" as="span">
            {row.original.name}
          </Text>
        </>
      ),
    },
    {
      id: 'team',
      accessorKey: 'team',
      header: 'Team',
      enableSorting: true,
      meta: { flex: 1 },
      cell: ({ row }) => (
        <Text variant="body2" as="span">
          {row.original.team}
        </Text>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      meta: { flex: 0.8 },
      cell: ({ row }) => {
        return (
          <Badge variant="success" size="small">
            {row.original.status.charAt(0).toUpperCase() +
              row.original.status.slice(1)}
          </Badge>
        )
      },
    },
  ]
}
