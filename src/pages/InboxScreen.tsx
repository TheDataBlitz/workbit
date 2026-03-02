import { PageHeader, Stack, Button } from '@design-system'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Mail, Plus, FolderKanban, AlertCircle } from 'lucide-react'
import { logbit } from '@thedatablitz/logbit-sdk'
import { LOGBIT_PROJECT_ID } from '../utils/errorHandling'

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 450px;
  max-width: 480px;
  margin: ${(p) => p.theme.spacing[8]}px auto;
  text-align: center;
  padding: ${(p) => p.theme.spacing[8]}px ${(p) => p.theme.spacing[6]}px;
  background: ${(p) => p.theme.colors.surface};
  border-radius: 16px;
  border: 1px solid ${(p) => p.theme.colors.border};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
`

const EmptyIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  margin-bottom: ${(p) => p.theme.spacing[5]}px;
  background: ${(p) => p.theme.colors.primaryBg};
  border-radius: 50%;

  svg {
    color: ${(p) => p.theme.colors.primary};
  }
`

const EmptyTitle = styled.h3`
  font-size: 1.375rem;
  font-weight: 600;
  color: ${(p) => p.theme.colors.text};
  margin: 0 0 ${(p) => p.theme.spacing[3]}px 0;
  line-height: 1.3;
`

const EmptyDescription = styled.p`
  font-size: 0.9375rem;
  color: ${(p) => p.theme.colors.textMuted};
  margin: 0 0 ${(p) => p.theme.spacing[6]}px 0;
  line-height: 1.6;
  max-width: 380px;
`

const ActionButtons = styled.div`
  display: flex;
  gap: ${(p) => p.theme.spacing[3]}px;
  flex-wrap: wrap;
  justify-content: center;
`

export function InboxScreen() {
  const navigate = useNavigate()
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const base = workspaceId ? `/workspace/${workspaceId}` : ''

  const handleThrowTestError = () => {
    logbit.error('Test error from Inbox', {
      projectId: LOGBIT_PROJECT_ID,
      title: 'Test error from Inbox',
      source: 'InboxScreen',
      workspaceId: workspaceId ?? null,
    })
  }

  return (
    <Stack gap={4}>
      <PageHeader
        title="Inbox"
        summary="Your notifications and updates will appear here."
      />

      <EmptyStateContainer>
        <EmptyIconWrapper>
          <Mail size={36} />
        </EmptyIconWrapper>

        <EmptyTitle>No notifications yet</EmptyTitle>
        <EmptyDescription>
          When you have new updates, mentions, or assignments, they'll appear
          here. Get started by creating an issue or exploring projects.
        </EmptyDescription>

        <ActionButtons>
          <Button
            variant="primary"
            onClick={() => navigate(`${base}/my-issues`)}
          >
            <Plus size={16} />
            Create Issue
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`${base}/workspace/projects`)}
          >
            <FolderKanban size={16} />
            View Projects
          </Button>
          <Button
            variant="secondary"
            onClick={handleThrowTestError}
            title="Logs an error to Logbit with projectId and throws"
          >
            <AlertCircle size={16} />
            Throw test error
          </Button>
        </ActionButtons>
      </EmptyStateContainer>
    </Stack>
  )
}
