import { Image, Pressable, Text, View } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';
import { styles } from './style';

export type PhaseAccent = 'primary' | 'tertiary' | 'outline';

export type PhaseProjectCardProps = {
  phaseLabel: string;
  phaseIcon: string;
  accent: PhaseAccent;
  title: string;
  description: string;
  leadAvatarUrl: string;
  leadKicker: string;
  leadName: string;
  contributorUrls: string[];
  extraContributors?: number;
  metrics: { issues: string; updates: string; decisions: string };
  progressPct: number;
  statusLabel: string;
  progressColor: string;
  vertical: 'up' | 'down' | 'none';
  glow?: boolean;
  alertBanner?: string;
  ctaLabel?: string;
  onOpenAnalysis?: () => void;
  disabled?: boolean;
};

const accentColors: Record<PhaseAccent, { border: string; phase: string }> = {
  primary: {
    border: stitchColors.primaryContainer,
    phase: stitchColors.primary,
  },
  tertiary: {
    border: stitchColors.tertiaryContainer,
    phase: stitchColors.tertiary,
  },
  outline: {
    border: stitchColors.outlineVariant,
    phase: stitchColors.neutral500,
  },
};

export function PhaseProjectCard({
  phaseLabel,
  phaseIcon,
  accent,
  title,
  description,
  leadAvatarUrl,
  leadKicker,
  leadName,
  contributorUrls,
  extraContributors,
  metrics,
  progressPct,
  statusLabel,
  progressColor,
  vertical,
  glow,
  alertBanner,
  ctaLabel = 'Ask Intellebit',
  onOpenAnalysis,
  disabled,
}: PhaseProjectCardProps) {
  const ac = accentColors[accent];
  const offsetStyle =
    vertical === 'up'
      ? styles.offsetUp
      : vertical === 'down'
        ? styles.offsetDown
        : null;

  return (
    <View style={[styles.column, offsetStyle, disabled && styles.archived]}>
      <View
        style={[
          styles.card,
          {
            borderColor: ac.border,
            backgroundColor: stitchColors.surfaceContainerLow,
          },
          glow && styles.cardGlow,
        ]}
      >
        <View>
          <View style={styles.phaseRow}>
            <Text style={[styles.phaseLabel, { color: ac.phase }]}>
              {phaseLabel}
            </Text>
            <Text style={[styles.phaseIcon, { color: ac.phase }]}>
              {phaseIcon}
            </Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.leadRow}>
            <Image
              source={{ uri: leadAvatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
            <View style={styles.leadMeta}>
              <Text style={[styles.leadKicker, { color: ac.phase }]}>
                {leadKicker}
              </Text>
              <Text style={styles.leadName}>{leadName}</Text>
            </View>
          </View>
          <View style={styles.avatarsRow}>
            {contributorUrls.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={[styles.tinyAvatar, i === 0 && styles.tinyAvatarFirst]}
                resizeMode="cover"
              />
            ))}
            {extraContributors != null && extraContributors > 0 ? (
              <View style={styles.morePill}>
                <Text style={[styles.moreText, { color: ac.phase }]}>
                  +{extraContributors}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metricsRow}>
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>{metrics.issues}</Text>
              <Text style={styles.metricLabel}>Issues</Text>
            </View>
            <View style={[styles.metricCell, styles.metricCellBorder]}>
              <Text style={styles.metricValue}>{metrics.updates}</Text>
              <Text style={styles.metricLabel}>Updates</Text>
            </View>
            <View style={styles.metricCell}>
              <Text style={styles.metricValue}>{metrics.decisions}</Text>
              <Text style={styles.metricLabel}>Decisions</Text>
            </View>
          </View>
        </View>
        <View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>{statusLabel}</Text>
            <Text style={styles.statusText}>{progressPct}%</Text>
          </View>
          <Pressable
            onPress={onOpenAnalysis}
            disabled={disabled}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: disabled
                  ? stitchColors.neutral800
                  : stitchColors.secondary,
                opacity: pressed && !disabled ? 0.9 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.ctaLabel,
                disabled && { color: stitchColors.neutral500 },
              ]}
            >
              {disabled ? 'Access Denied' : ctaLabel}
            </Text>
          </Pressable>
        </View>
      </View>
      {alertBanner ? (
        <View style={styles.alertRow}>
          <View style={styles.alertDot} />
          <Text style={styles.alertText}>{alertBanner}</Text>
        </View>
      ) : null}
    </View>
  );
}
