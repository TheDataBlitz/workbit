import { Avatar } from '@thedatablitz/avatar';
import { Alert } from '@thedatablitz/alert';
import { Button } from '@thedatablitz/button';
import { Card, CardContent } from '@thedatablitz/card';
import { Inline } from '@thedatablitz/inline';
import { Stack } from '@thedatablitz/stack';
import { Text } from '@thedatablitz/text';
import { getToken } from '@thedatablitz/tokens';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ApiWorkspace } from '../../api/client';
import { useAuth } from '../auth/useAuth';
import { useWorkspacesData } from './hooks/useWorkspacesData';

export type SelectWorkspacesScreenProps = {
  onWorkspaceSelected: (workspace: ApiWorkspace) => void;
};

export function SelectWorkspacesScreen({
  onWorkspaceSelected,
}: SelectWorkspacesScreenProps) {
  const insets = useSafeAreaInsets();
  const { state } = useAuth();

  const userId =
    state.status === 'authenticated' ? state.session.user.id : null;
  const authLoading = state.status === 'loading';

  const { memberError, workspaces, workspacesLoading, workspacesError } =
    useWorkspacesData({ userId, authLoading });

  const bg = getToken('elevation.surface.sunken');
  const border = getToken('color.border.DEFAULT');

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: bg }]}
      contentContainerStyle={{
        paddingTop: 12,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}
    >
      <Stack gap="400" fullWidth>
        <Inline align="center" gap="100" wrap={false}>
          <Avatar name="Workbit" size="small" variant="brand" />
          <Text variant="heading5">Workbit</Text>
        </Inline>

        <Stack gap="100" fullWidth>
          <Text variant="heading1">Select Workspaces</Text>
          <Text variant="body2" color="color.text.subtle">
            Choose a workspace you belong to.
          </Text>
        </Stack>

        <Card type="bordered" variant="default" fullWidth>
          <CardContent>
            <Stack gap="200" fullWidth>
              <Stack gap="050" fullWidth>
                <Text variant="heading3">Your workspaces</Text>
                <Text variant="body3" color="color.text.subtle">
                  Select a workspace to open it.
                </Text>
              </Stack>

              {workspacesLoading ? (
                <View style={styles.loadingBlock}>
                  <ActivityIndicator
                    color={getToken('color.icon.information')}
                  />
                </View>
              ) : null}

              {memberError ? (
                <Alert
                  variant="error"
                  placement="inline"
                  description={memberError}
                />
              ) : null}

              {workspacesError ? (
                <Alert
                  variant="error"
                  placement="inline"
                  description={`Failed to load workspaces: ${workspacesError}`}
                />
              ) : null}

              {!workspacesLoading &&
              !workspacesError &&
              !memberError &&
              workspaces.length === 0 ? (
                <Text
                  variant="body2"
                  color="color.text.subtle"
                  style={styles.emptyText}
                >
                  No workspaces available. Ask an admin to add you to a
                  workspace.
                </Text>
              ) : null}

              {!workspacesLoading &&
                !workspacesError &&
                !memberError &&
                workspaces.map(workspace => (
                  <Inline
                    key={workspace.id}
                    align="center"
                    gap="200"
                    fullWidth
                    wrap={false}
                    style={{
                      ...styles.workspaceRow,
                      borderBottomColor: border,
                    }}
                  >
                    <Avatar
                      name={workspace.name}
                      size="medium"
                      variant="brand"
                    />
                    <Stack gap="025" style={styles.workspaceMeta}>
                      <Text variant="body1">{workspace.name}</Text>
                      <Text variant="caption2" color="color.text.subtle">
                        workbit.app/{workspace.slug} ·{' '}
                        {workspace.region.toUpperCase()}
                      </Text>
                    </Stack>
                    <Button
                      variant="glass"
                      size="small"
                      onPress={() => onWorkspaceSelected(workspace)}
                    >
                      Select
                    </Button>
                  </Inline>
                ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </ScrollView>
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
    paddingVertical: 20,
  },
  workspaceRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  workspaceMeta: {
    flex: 1,
    minWidth: 0,
  },
});
