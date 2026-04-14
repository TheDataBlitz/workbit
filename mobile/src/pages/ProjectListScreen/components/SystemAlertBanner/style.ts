import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 28,
    marginBottom: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: stitchColors.white05,
    backgroundColor: `${stitchColors.surfaceContainerHigh}99`,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  ping: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: stitchColors.error,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '700',
    color: stitchColors.error,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  body: {
    fontSize: 11,
    color: stitchColors.neutral400,
    marginTop: 2,
  },
  bodyBold: {
    color: stitchColors.white,
    fontWeight: '700',
  },
  action: {
    fontSize: 9,
    fontWeight: '700',
    color: stitchColors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: `${stitchColors.primary}66`,
    paddingBottom: 2,
  },
});
