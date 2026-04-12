import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderColor: stitchColors.white10,
    backgroundColor: `${stitchColors.backgroundDeep}cc`,
  },
  tabsScroll: {
    flex: 1,
    maxHeight: 56,
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tab: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: stitchColors.white05,
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: stitchColors.white05,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: stitchColors.primary,
  },
  tabLabelIdle: {
    color: stitchColors.white40,
  },
  closeBtn: {
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: stitchColors.white10,
  },
  closeLabel: {
    fontSize: 20,
    color: stitchColors.white40,
  },
});
