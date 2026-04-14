import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 22,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: stitchColors.white05,
    backgroundColor: '#0a0a0a',
  },
  btn: {
    backgroundColor: stitchColors.magentaDeep,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 14,
    borderRadius: 0,
    shadowColor: stitchColors.magentaDeep,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  btnPressed: {
    opacity: 0.9,
  },
  icon: {
    fontSize: 22,
    color: stitchColors.white,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    color: stitchColors.white,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
