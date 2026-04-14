import { Text, View } from 'react-native';
import { styles } from './style';

type Props = {
  status: string;
  date: string;
  title: string;
  decisionBy: string;
  rationale: string;
  impact: string;
};

export function DecisionEntry({
  status,
  date,
  title,
  decisionBy,
  rationale,
  impact,
}: Props) {
  return (
    <View style={styles.block}>
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{status}</Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.byRow}>
          <Text style={styles.byLabel}>Decision by:</Text>
          <Text style={styles.byName}>{decisionBy}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        <View style={styles.col}>
          <Text style={styles.sectionLabel}>Rationale</Text>
          <Text style={styles.sectionBody}>{rationale}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.sectionLabel}>Impact</Text>
          <Text style={styles.sectionBody}>{impact}</Text>
        </View>
      </View>
    </View>
  );
}
