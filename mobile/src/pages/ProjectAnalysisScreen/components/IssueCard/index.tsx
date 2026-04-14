import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from './style';

type SubIssue = {
  id: string;
  status: string;
  statusVariant: 'warning' | 'muted';
  title: string;
  assignee: string;
};

type Props = {
  issueId: string;
  title: string;
  statusLabel: string;
  owner: string;
  project: string;
  dueDate: string;
  subIssues: SubIssue[];
};

export function IssueCard({
  issueId,
  title,
  statusLabel,
  owner,
  project,
  dueDate,
  subIssues,
}: Props) {
  const [open, setOpen] = useState(true);

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => setOpen(!open)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.issueId}>{issueId}</Text>
          <Text style={styles.issueTitle}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Text style={[styles.chevron, open && styles.chevronOpen]}>⌄</Text>
        </View>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          <View style={styles.metaGrid}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Owner</Text>
              <Text style={styles.metaValue}>{owner}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Project</Text>
              <Text style={[styles.metaValue, styles.metaValueMuted]}>
                {project}
              </Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={[styles.metaValue, styles.metaValueMuted]}>
                {dueDate}
              </Text>
            </View>
          </View>
          <View style={styles.subHeader}>
            <Text style={styles.subHeaderText}>Linked Dependencies</Text>
            <View style={styles.subRule} />
          </View>
          {subIssues.map(sub => (
            <View key={sub.id} style={styles.subCard}>
              <View style={styles.subTop}>
                <Text style={styles.subId}>{sub.id}</Text>
                <View
                  style={[
                    styles.warnPill,
                    sub.statusVariant === 'muted' && styles.warnPillMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.warnText,
                      sub.statusVariant === 'muted' && styles.warnTextMuted,
                    ]}
                  >
                    {sub.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.subBody}>{sub.title}</Text>
              <View style={styles.assigneeRow}>
                <Text style={styles.assignee}>👤 {sub.assignee}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
