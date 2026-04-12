import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 28,
    marginBottom: 36,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '700',
    color: stitchColors.primary,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: `${stitchColors.primary}55`,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: stitchColors.white,
    letterSpacing: -1,
  },
});
