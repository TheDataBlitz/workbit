import { Image, Text, View } from 'react-native';
import { styles } from './style';

type Props = {
  avatarUrl: string;
  name: string;
  role: string;
  timeAgo: string;
  statusLabel: string;
  statusTone: 'primary' | 'muted';
  body: string;
  ownerLabel: string;
  ownerValue: string;
  ownerTone?: 'primary' | 'muted';
};

export function UpdateEntry({
  avatarUrl,
  name,
  role,
  timeAgo,
  statusLabel,
  statusTone,
  body,
  ownerLabel,
  ownerValue,
  ownerTone = 'primary',
}: Props) {
  return (
    <View style={styles.block}>
      <View style={styles.top}>
        <View style={styles.left}>
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{role}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <Text style={styles.time}>{timeAgo}</Text>
          <View
            style={[
              styles.statePill,
              statusTone === 'muted' && styles.statePillMuted,
            ]}
          >
            <Text
              style={[
                styles.stateText,
                statusTone === 'muted' && styles.stateTextMuted,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.body}>{body}</Text>
      <View style={styles.ownerRow}>
        <Text style={styles.ownerLabel}>{ownerLabel}</Text>
        <Text
          style={[
            styles.ownerValue,
            ownerTone === 'muted' && styles.ownerValueMuted,
          ]}
        >
          {ownerValue}
        </Text>
      </View>
    </View>
  );
}
