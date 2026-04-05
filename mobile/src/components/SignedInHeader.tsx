import { Avatar } from '@thedatablitz/avatar';
import { Button } from '@thedatablitz/button';
import { Icon } from '@thedatablitz/icon';
import { Inline } from '@thedatablitz/inline';
import { Text } from '@thedatablitz/text';
import { getToken } from '@thedatablitz/tokens';
import { StyleSheet, View } from 'react-native';

export type SignedInHeaderProps = {
  email: string | undefined;
  userId: string;
  onSignOut: () => void;
  /** When set, shows an icon control to leave the current workspace (picker). */
  workspaceActive?: boolean;
  onSwitchWorkspace?: () => void;
};

export function SignedInHeader({
  email,
  userId,
  onSignOut,
  workspaceActive,
  onSwitchWorkspace,
}: SignedInHeaderProps) {
  const label = email ?? userId;
  const border = getToken('color.border.DEFAULT');

  return (
    <View style={[styles.bar, { borderBottomColor: border }]}>
      <Inline align="center" gap="150" fullWidth wrap={false}>
        <Avatar name={label} size="medium" variant="brand" />
        <View style={styles.labelWrap}>
          <Text variant="body2" truncate>
            {label}
          </Text>
        </View>
        <Inline align="center" gap="050" wrap={false}>
          {workspaceActive && onSwitchWorkspace ? (
            <Button
              buttonType="icon"
              variant="primary"
              size="medium"
              accessibilityLabel="Switch workspace"
              onPress={onSwitchWorkspace}
              icon={<Icon name="Layers" size="small" />}
            />
          ) : null}
          <Button
            buttonType="icon"
            variant="danger"
            size="medium"
            accessibilityLabel="Sign out"
            onPress={() => void onSignOut()}
            icon={<Icon name="LogOut" size="small" />}
          />
        </Inline>
      </Inline>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelWrap: {
    flex: 1,
    minWidth: 0,
  },
});
