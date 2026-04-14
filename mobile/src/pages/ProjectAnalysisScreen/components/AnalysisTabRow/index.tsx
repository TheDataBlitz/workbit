import { Pressable, ScrollView, Text, View } from 'react-native';
import type { AnalysisTab } from '../../../../navigation/types';
import { styles } from './style';

const TABS: { key: AnalysisTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'updates', label: 'Updates' },
  { key: 'issues', label: 'Issues' },
  { key: 'decisions', label: 'Decisions' },
];

type Props = {
  active: AnalysisTab;
  onChange: (t: AnalysisTab) => void;
  onClose: () => void;
};

export function AnalysisTabRow({ active, onChange, onClose }: Props) {
  return (
    <View style={styles.row}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map(tab => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelIdle,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
        <Text style={styles.closeLabel}>✕</Text>
      </Pressable>
    </View>
  );
}
