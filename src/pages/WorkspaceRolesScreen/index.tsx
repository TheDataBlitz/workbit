import { Alert } from '@thedatablitz/alert'
import { PageHeader } from '@thedatablitz/page-header'
import { Text } from '@thedatablitz/text'
import { Badge } from '@thedatablitz/badge'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Table } from '@thedatablitz/table'
import { fetchRoles } from '../../api/client'
import { useFetch } from '../../hooks/useFetch'
import { mapRolesToRows } from './utils'
import { createRoleColumn } from './utils/createRoleColumn'

export function WorkspaceRolesScreen() {
  const { data, loading, error } = useFetch(fetchRoles)

  const roles = mapRolesToRows(data ?? [])

  return (
    <Stack gap="400">
      <PageHeader
        avatar={{
          name: 'Roles',
        }}
        title="Roles"
        subtitle="Workspace roles and permissions."
      />
      {error ? (
        <Alert
          variant="error"
          placement="inline"
          description={`Failed to load roles: ${error}`}
          className="w-full"
        />
      ) : null}
      {!loading ? (
        <Stack gap="100">
          <Inline gap="050">
            <Text variant="heading6">Roles</Text>
            <Badge variant="warning" size="small">
              {roles.length}
            </Badge>
          </Inline>
          <Table
            columns={createRoleColumn()}
            data={roles}
            searchable={false}
            columnFilterable={false}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
