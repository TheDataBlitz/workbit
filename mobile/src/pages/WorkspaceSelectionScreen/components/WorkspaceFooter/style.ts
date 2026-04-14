import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 28,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: stitchColors.primary,
  },
  dotInactive: {
    backgroundColor: stitchColors.white20,
  },
  hint: {
    fontSize: 9,
    letterSpacing: 2,
    color: stitchColors.onSurfaceVariant,
    opacity: 0.4,
    textTransform: 'uppercase',
  },
});
