import { StyleSheet } from 'react-native';
import { stitchColors } from '../../theme/stitchColors';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: stitchColors.background,
  },
  header: {
    paddingTop: 8,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    color: stitchColors.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: stitchColors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.6,
    textAlign: 'center',
  },
  carousel: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  carouselContent: {
    alignItems: 'center',
  },
});
