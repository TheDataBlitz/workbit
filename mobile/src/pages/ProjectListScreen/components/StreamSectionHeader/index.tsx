import { Text, View } from 'react-native';
import { styles } from './style';

export function StreamSectionHeader() {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.kicker}>Temporal Registry</Text>
        <View style={styles.rule} />
      </View>
      <Text style={styles.title}>Project Stream</Text>
    </View>
  );
}
