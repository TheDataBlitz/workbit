import { StyleSheet } from 'react-native';
import { stitchColors } from '../../../../theme/stitchColors';

export const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: stitchColors.white10,
    backgroundColor: stitchColors.white05,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 4,
  },
  issueId: {
    fontSize: 10,
    fontWeight: '700',
    color: stitchColors.white30,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  issueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: stitchColors.white,
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${stitchColors.error}55`,
    backgroundColor: `${stitchColors.error}14`,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
    color: stitchColors.error,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  chevron: {
    fontSize: 18,
    color: stitchColors.white30,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  body: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 18,
  },
  metaGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: stitchColors.white05,
    paddingVertical: 16,
    gap: 8,
  },
  metaCell: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: stitchColors.white20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: '700',
    color: stitchColors.primary,
  },
  metaValueMuted: {
    color: `${stitchColors.onBackground}cc`,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subHeaderText: {
    fontSize: 9,
    fontWeight: '700',
    color: stitchColors.white20,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subRule: {
    flex: 1,
    height: 1,
    backgroundColor: stitchColors.white05,
  },
  subCard: {
    backgroundColor: `${stitchColors.backgroundDeep}cc`,
    borderWidth: 1,
    borderColor: stitchColors.white05,
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  subTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subId: {
    fontSize: 9,
    fontWeight: '700',
    color: stitchColors.white20,
    textTransform: 'uppercase',
  },
  warnPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: `${stitchColors.warning}44`,
    backgroundColor: `${stitchColors.warning}12`,
  },
  warnText: {
    fontSize: 8,
    fontWeight: '900',
    color: stitchColors.warning,
    textTransform: 'uppercase',
  },
  warnPillMuted: {
    borderColor: stitchColors.white10,
    backgroundColor: stitchColors.white05,
  },
  warnTextMuted: {
    color: stitchColors.white40,
  },
  subBody: {
    fontSize: 13,
    color: `${stitchColors.white}ee`,
    fontWeight: '500',
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: stitchColors.white05,
  },
  assignee: {
    fontSize: 9,
    color: stitchColors.white30,
    textTransform: 'uppercase',
  },
});
