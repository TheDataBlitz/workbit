import { Accordion } from '@thedatablitz/accordion';
import { Alert } from '@thedatablitz/alert';
import { Badge } from '@thedatablitz/badge';
import { Button } from '@thedatablitz/button';
import { Card, CardContent, CardFooter } from '@thedatablitz/card';
import { Inline } from '@thedatablitz/inline';
import { PageHeader } from '@thedatablitz/page-header';
import { Stack } from '@thedatablitz/stack';
import { Text } from '@thedatablitz/text';
import { getToken } from '@thedatablitz/tokens';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ApiWorkspace } from '../../api/client';
import { useAuth } from '../auth/useAuth';
import { ProjectAskModal } from './ProjectAskModal';
import { ProjectIssuesPanel } from './ProjectIssuesPanel';
import { useWorkspaceProjects } from './hooks/useWorkspaceProjects';
import { useWorkspacesData } from './hooks/useWorkspacesData';

export type WorkspaceProjectsScreenProps = {
  workspace: ApiWorkspace;
};

function formatStatus(status: string): string {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type ProjectStatusBadgeVariant =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ai';

/** Map API project status strings to badge variants (tokens-backed colors). */
function badgeVariantForProjectStatus(
  status: string,
): ProjectStatusBadgeVariant {
  const s = status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!s) return 'default';
  if (['completed', 'done', 'closed', 'resolved', 'shipped'].includes(s)) {
    return 'success';
  }
  if (['cancelled', 'canceled', 'abandoned'].includes(s)) {
    return 'danger';
  }
  if (
    [
      'paused',
      'blocked',
      'on_hold',
      'onhold',
      'at_risk',
      'delayed',
      'risk',
    ].includes(s)
  ) {
    return 'warning';
  }
  if (
    ['active', 'in_progress', 'progress', 'ongoing', 'execution'].includes(s)
  ) {
    return 'brand';
  }
  if (
    [
      'planned',
      'planning',
      'draft',
      'backlog',
      'todo',
      'discovery',
      'ideation',
    ].includes(s)
  ) {
    return 'info';
  }
  if (['archived'].includes(s)) {
    return 'default';
  }
  return 'default';
}

/** Accordion header is plain text (RN); show description preview, expand for issues. */
function descriptionAccordionTitle(description: string): string {
  const normalized = description.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'No description · tap for issues';
  const max = 72;
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export function WorkspaceProjectsScreen({
  workspace,
}: WorkspaceProjectsScreenProps) {
  const insets = useSafeAreaInsets();
  const { state } = useAuth();
  const userId =
    state.status === 'authenticated' ? state.session.user.id : null;
  const authLoading = state.status === 'loading';

  const { memberId, memberError, workspacesLoading } = useWorkspacesData({
    userId,
    authLoading,
  });

  const memberReady =
    !authLoading && !workspacesLoading && !memberError && Boolean(memberId);

  const projectsQuery = useWorkspaceProjects({
    workspaceId: workspace.id,
    memberId,
    enabled: memberReady,
  });

  const bg = getToken('elevation.surface.sunken');
  const projects = projectsQuery.data ?? [];
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>([]);
  const [askTarget, setAskTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const onAccordionToggle = useCallback((id: string, expanded: boolean) => {
    setExpandedProjectIds(prev =>
      expanded
        ? prev.includes(id)
          ? prev
          : [...prev, id]
        : prev.filter(x => x !== id),
    );
  }, []);
  const loading =
    workspacesLoading ||
    (memberReady && (projectsQuery.isPending || projectsQuery.isFetching));
  const error =
    projectsQuery.error instanceof Error
      ? projectsQuery.error.message
      : projectsQuery.isError
        ? 'Failed to load projects.'
        : null;

  return (
    <>
      <ScrollView
        style={[styles.scroll, { backgroundColor: bg }]}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 20,
        }}
      >
        <Stack gap="300" fullWidth>
          <PageHeader
            avatar={{ name: 'Projects' }}
            title="Workspace projects"
            subtitle={`All projects in ${workspace.name}.`}
          />

          {memberError ? (
            <Alert
              variant="error"
              placement="inline"
              description={memberError}
            />
          ) : null}

          {error && !memberError ? (
            <Alert
              variant="error"
              placement="inline"
              description={`Failed to load projects: ${error}`}
            />
          ) : null}

          <Stack gap="200" fullWidth>
            {loading ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color={getToken('color.icon.information')} />
              </View>
            ) : null}

            {!loading && !error && !memberError && projects.length === 0 ? (
              <Text
                variant="body2"
                color="color.text.subtle"
                style={styles.emptyText}
              >
                No projects in this workspace yet.
              </Text>
            ) : null}

            {!loading && !error && !memberError
              ? projects.map(project => {
                  const statusBadgeVariant = badgeVariantForProjectStatus(
                    project.status,
                  );
                  return (
                    <Card
                      key={project.id}
                      type="bordered"
                      variant="ai"
                      fullWidth
                    >
                      <CardContent>
                        <Inline align="center" gap="100" wrap>
                          <Badge
                            label={project.name}
                            size="small"
                            variant="brand"
                          />
                          <Badge
                            label={project.team.name}
                            size="small"
                            variant="warning"
                          />
                          <Badge
                            label={formatStatus(project.status)}
                            size="small"
                            variant={statusBadgeVariant}
                            outlined={statusBadgeVariant === 'default'}
                          />
                        </Inline>
                      </CardContent>
                      <CardContent divider>
                        <Accordion
                          size="medium"
                          variant="ai"
                          expandedIds={
                            expandedProjectIds.includes(project.id)
                              ? [project.id]
                              : []
                          }
                          onToggle={onAccordionToggle}
                          items={[
                            {
                              id: project.id,
                              title: descriptionAccordionTitle(
                                project.description,
                              ),
                              content: (
                                <Stack gap="200" fullWidth>
                                  {project.description.trim() ? (
                                    <Text
                                      variant="body3"
                                      color="color.text.subtle"
                                    >
                                      {project.description.trim()}
                                    </Text>
                                  ) : null}
                                  <ProjectIssuesPanel
                                    teamId={project.team.id}
                                    projectId={project.id}
                                  />
                                </Stack>
                              ),
                            },
                          ]}
                        />
                      </CardContent>
                      <CardFooter>
                        <Button
                          buttonType="default"
                          variant="ai"
                          size="small"
                          accessibilityLabel="Ask about this project"
                          onPress={() =>
                            setAskTarget({
                              id: project.id,
                              name: project.name,
                            })
                          }
                        >
                          Ask
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              : null}
          </Stack>
        </Stack>
      </ScrollView>
      <ProjectAskModal
        visible={askTarget != null}
        onClose={() => setAskTarget(null)}
        projectId={askTarget?.id ?? ''}
        projectName={askTarget?.name ?? ''}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  loadingBlock: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 16,
  },
});
