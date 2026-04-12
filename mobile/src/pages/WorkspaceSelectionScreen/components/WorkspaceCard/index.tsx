import LinearGradient from 'react-native-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';
import { styles } from './style';

export type WorkspaceCardVariant = 'acme' | 'studio' | 'personal';

type Props = {
  variant: WorkspaceCardVariant;
  eyebrow: string;
  titleLine1: string;
  titleLine2?: string;
  description: string;
  iconChar: string;
  accentColor: string;
  onPress: () => void;
};

const meshColors: Record<WorkspaceCardVariant, [string, string, string]> = {
  acme: ['#4a0022', '#1a000a', stitchColors.background],
  studio: ['#3d0a5c', '#1a0a2e', stitchColors.background],
  personal: ['#004d40', '#0a1f1a', stitchColors.background],
};

export function WorkspaceCard({
  variant,
  eyebrow,
  titleLine1,
  titleLine2,
  description,
  iconChar,
  accentColor,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
      ]}
    >
      <LinearGradient
        colors={meshColors[variant]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.gradient}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.inner} pointerEvents="none">
        <View
          style={[styles.topRule, { backgroundColor: `${accentColor}55` }]}
        />
        <View style={{ gap: 12, alignItems: 'center' }}>
          <Text style={[styles.label, { color: accentColor }]}>{eyebrow}</Text>
          <Text style={styles.name}>
            {titleLine1}
            {titleLine2 ? `\n${titleLine2}` : ''}
          </Text>
        </View>
        <View style={{ width: '100%' }}>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.iconWrap}>
            <Text style={styles.iconText}>{iconChar}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
