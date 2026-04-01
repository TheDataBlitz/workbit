import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { Avatar } from '@thedatablitz/avatar'
import { Dropdown } from '@thedatablitz/dropdown'
import { Text } from '@thedatablitz/text'

import type { WorkspaceDropdownProps } from './types'
import { getDisplayWorkspace, getWorkspaceInitials } from './utils/helpers'

const CREATE_WORKSPACE_VALUE = '__workbit_create_workspace__'

export function WorkspaceDropdown({
  workspaces,
  selectedWorkspace,
  onSelect,
}: WorkspaceDropdownProps) {
  const navigate = useNavigate()
  const displayWorkspace = getDisplayWorkspace(selectedWorkspace, workspaces)

  const options = useMemo(() => {
    const workspaceOptions = workspaces.map((workspace) => ({
      value: workspace.id,
      label: workspace.name,
      icon: (
        <Avatar
          name={getWorkspaceInitials(workspace.name)}
          size="small"
          variant="default"
        />
      ),
    }))
    return [
      ...workspaceOptions,
      {
        value: CREATE_WORKSPACE_VALUE,
        label: (
          <Text variant="body3" color="color.text.information">
            Create new workspace
          </Text>
        ),
        icon: <Plus size={16} aria-hidden className="shrink-0 text-blue-600" />,
      },
    ]
  }, [workspaces])

  return (
    <Dropdown
      options={options}
      value={displayWorkspace?.id ?? ''}
      placeholder="Workspace"
      size="small"
      onChange={(value) => {
        if (value === CREATE_WORKSPACE_VALUE) {
          navigate('/workspaces')
          return
        }
        const workspace = workspaces.find((w) => w.id === value)
        if (workspace) {
          onSelect(workspace)
          navigate(`/workspace/${workspace.id}/workspace/projects`)
        }
      }}
    />
  )
}
