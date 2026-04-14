import { StyleSheet } from 'react-native';
import { stitchColors } from '../../theme/stitchColors';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: stitchColors.background,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    maxHeight: 560,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 40,
  },
  timelineLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 200,
    height: 1,
    backgroundColor: `${stitchColors.outlineVariant}55`,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: stitchColors.white10,
    backgroundColor: stitchColors.white05,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
  },
  fabText: {
    color: stitchColors.white,
    fontSize: 18,
  },
});
