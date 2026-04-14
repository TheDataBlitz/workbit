import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const CARD_WIDTH = 280;

export const styles = StyleSheet.create({
  column: {
    width: CARD_WIDTH,
  },
  offsetUp: {
    marginTop: -32,
  },
  offsetDown: {
    marginTop: 48,
  },
  card: {
    minHeight: 360,
    padding: 18,
    borderWidth: 1,
    justifyContent: 'space-between',
    borderRadius: 2,
  },
  cardGlow: {
    shadowColor: stitchColors.primaryContainer,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  phaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  phaseLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  phaseIcon: {
    fontSize: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: stitchColors.white,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 12,
    color: stitchColors.onSurfaceVariant,
    lineHeight: 18,
    opacity: 0.85,
    marginBottom: 16,
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: stitchColors.white10,
  },
  leadMeta: {
    gap: 2,
  },
  leadKicker: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  leadName: {
    fontSize: 10,
    fontWeight: '700',
    color: stitchColors.white,
  },
  avatarsRow: {
    flexDirection: 'row',
    marginLeft: 0,
  },
  tinyAvatar: {
    width: 18,
    height: 18,
    borderRadius: 2,
    marginLeft: -4,
    borderWidth: 2,
    borderColor: stitchColors.surfaceContainerLow,
  },
  tinyAvatarFirst: {
    marginLeft: 0,
  },
  morePill: {
    width: 18,
    height: 18,
    marginLeft: -4,
    backgroundColor: stitchColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: stitchColors.surfaceContainerLow,
  },
  moreText: {
    fontSize: 7,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: stitchColors.white05,
    paddingVertical: 10,
    marginBottom: 12,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricCellBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: stitchColors.white05,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: stitchColors.white,
  },
  metricLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: stitchColors.onSurfaceVariant,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 4,
    backgroundColor: stitchColors.surfaceContainerHighest,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: stitchColors.neutral400,
    letterSpacing: 0.5,
  },
  cta: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 2,
  },
  ctaLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: stitchColors.white,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: stitchColors.error,
  },
  alertText: {
    fontSize: 8,
    fontWeight: '700',
    color: stitchColors.error,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  archived: {
    opacity: 0.55,
  },
});
