import { Text, View } from 'react-native';
import { styles } from './style';

type Props = {
  activeIndex: number;
  total: number;
};

export function WorkspaceFooter({ activeIndex, total }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.hint}>Swipe to transition between dimensions</Text>
    </View>
  );
}
