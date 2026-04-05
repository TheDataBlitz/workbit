import { Badge } from '@thedatablitz/badge';
import { Inline } from '@thedatablitz/inline';
import { Stack } from '@thedatablitz/stack';
import { Text } from '@thedatablitz/text';
import { getToken } from '@thedatablitz/tokens';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useProjectIssues } from './hooks/useProjectIssues';

function formatStatus(status: string): string {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

type IssueStatusBadgeVariant =
  | 'default'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ai';

/** Aligns with web issue statuses (backlog, todo, in_progress, done, canceled, duplicate). */
function badgeVariantForIssueStatus(status: string): IssueStatusBadgeVariant {
  const s = status
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!s) return 'default';
  if (['done', 'closed', 'resolved'].includes(s)) return 'success';
  if (['canceled', 'cancelled'].includes(s)) return 'danger';
  if (['in_progress', 'progress'].includes(s)) return 'warning';
  if (['todo'].includes(s)) return 'info';
  if (['backlog', 'duplicate'].includes(s)) return 'default';
  return 'default';
}

export type ProjectIssuesPanelProps = {
  teamId: string;
  projectId: string;
};

export function ProjectIssuesPanel({
  teamId,
  projectId,
}: ProjectIssuesPanelProps) {
  const { data, isPending, isError, error } = useProjectIssues({
    teamId,
    projectId,
    enabled: true,
    filter: 'all',
  });

  if (isPending) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={getToken('color.icon.information')} />
      </View>
    );
  }

  if (isError) {
    return (
      <Text variant="body3" color="color.text.subtle">
        {error instanceof Error ? error.message : 'Could not load issues.'}
      </Text>
    );
  }

  const issues = data ?? [];
  const roots = issues.filter(i => i.parentIssueId == null);

  if (roots.length === 0) {
    return (
      <Text variant="body3" color="color.text.subtle">
        No issues in this project yet.
      </Text>
    );
  }

  return (
    <Stack gap="150" fullWidth>
      {roots.map(issue => {
        const statusVariant = badgeVariantForIssueStatus(issue.status);
        return (
          <View key={issue.id} style={styles.issueBlock}>
            <Text variant="body2">{issue.title}</Text>
            <Inline align="center" gap="100" wrap>
              <Badge
                label={formatStatus(issue.status)}
                size="small"
                variant={statusVariant}
                outlined={statusVariant === 'default'}
              />
              {issue.assignee?.name ? (
                <Text variant="caption2" color="color.text.subtle">
                  {issue.assignee.name}
                </Text>
              ) : null}
            </Inline>
          </View>
        );
      })}
    </Stack>
  );
}

const styles = StyleSheet.create({
  centered: {
    paddingVertical: 16,
    alignItems: 'flex-start',
  },
  issueBlock: {
    gap: 4,
  },
});
