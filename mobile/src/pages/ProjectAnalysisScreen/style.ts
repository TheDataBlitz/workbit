import { Dimensions, StyleSheet } from 'react-native';
import { stitchColors } from '../../theme/stitchColors';

const { height } = Dimensions.get('window');

export const SHEET_HEIGHT = Math.round(height * 0.9);

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    minHeight: height,
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: stitchColors.black80,
    zIndex: 0,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    zIndex: 1,
    borderTopWidth: 1,
    borderColor: stitchColors.white10,
    backgroundColor: stitchColors.backgroundDeep,
  },
  scroll: {
    flex: 1,
  },
  overview: {
    padding: 24,
    gap: 8,
  },
  overviewTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: stitchColors.white,
  },
  overviewBody: {
    fontSize: 14,
    color: stitchColors.onSurfaceVariant,
    lineHeight: 22,
  },
});
