import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const styles = StyleSheet.create({
  block: {
    padding: 28,
    borderBottomWidth: 1,
    borderColor: stitchColors.white05,
    gap: 18,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    gap: 14,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: stitchColors.white10,
    backgroundColor: stitchColors.backgroundDeep,
  },
  nameBlock: {
    justifyContent: 'center',
    gap: 6,
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: stitchColors.white,
    letterSpacing: -0.2,
  },
  role: {
    fontSize: 9,
    fontWeight: '700',
    color: stitchColors.white30,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  time: {
    fontSize: 9,
    color: stitchColors.white20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: `${stitchColors.primary}55`,
    backgroundColor: `${stitchColors.primary}14`,
  },
  statePillMuted: {
    borderColor: stitchColors.white10,
    backgroundColor: stitchColors.white05,
  },
  stateText: {
    fontSize: 9,
    fontWeight: '900',
    color: stitchColors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  stateTextMuted: {
    color: stitchColors.white40,
  },
  body: {
    fontSize: 15,
    color: `${stitchColors.onSurfaceVariant}ee`,
    lineHeight: 24,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  ownerLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: stitchColors.white10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ownerValue: {
    fontSize: 9,
    fontWeight: '900',
    color: `${stitchColors.primary}99`,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ownerValueMuted: {
    color: stitchColors.white30,
  },
});
