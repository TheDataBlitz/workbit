import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const styles = StyleSheet.create({
  block: {
    padding: 28,
    borderBottomWidth: 1,
    borderColor: stitchColors.white05,
    gap: 20,
  },
  topRow: {
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: stitchColors.magentaDeep,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 0,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: stitchColors.white,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 9,
    color: stitchColors.white30,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: stitchColors.white,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  byRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  byLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: stitchColors.white20,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  byName: {
    fontSize: 9,
    fontWeight: '900',
    color: stitchColors.secondaryLight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  grid: {
    gap: 20,
    paddingTop: 4,
  },
  col: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: stitchColors.white20,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionBody: {
    fontSize: 14,
    color: stitchColors.onSurfaceVariant,
    lineHeight: 22,
  },
});
