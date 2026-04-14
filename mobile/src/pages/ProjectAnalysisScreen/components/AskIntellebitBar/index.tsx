import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './style';

type Props = {
  onPress?: () => void;
};

export function AskIntellebitBar({ onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      >
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.label}>Ask Intellebit</Text>
      </Pressable>
    </View>
  );
}
