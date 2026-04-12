import { Dimensions, StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

const { width } = Dimensions.get('window');
export const CARD_WIDTH = Math.min(width * 0.82, 320);
export const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

export const styles = StyleSheet.create({
  pressable: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: stitchColors.white10,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  inner: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRule: {
    width: '100%',
    height: 1,
    backgroundColor: stitchColors.white10,
  },
  label: {
    fontSize: 9,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '700',
    textAlign: 'center',
  },
  name: {
    fontSize: 36,
    fontWeight: '900',
    color: stitchColors.white,
    textTransform: 'uppercase',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 40,
  },
  description: {
    fontSize: 13,
    color: stitchColors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
  iconWrap: {
    marginTop: 20,
    alignItems: 'center',
  },
  iconText: {
    fontSize: 28,
    color: stitchColors.onSurfaceVariant,
  },
});
