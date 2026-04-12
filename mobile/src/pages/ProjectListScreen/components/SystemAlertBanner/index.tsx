import { Pressable, Text, View } from 'react-native';
import { styles } from './style';

type Props = {
  phaseName: string;
  onResolve?: () => void;
};

export function SystemAlertBanner({ phaseName, onResolve }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.ping} />
        <View>
          <Text style={styles.kicker}>System Alert</Text>
          <Text style={styles.body}>
            Bottleneck detected at{' '}
            <Text style={styles.bodyBold}>{phaseName}</Text> phase.
          </Text>
        </View>
      </View>
      <Pressable onPress={onResolve}>
        <Text style={styles.action}>Resolve</Text>
      </Pressable>
    </View>
  );
}
