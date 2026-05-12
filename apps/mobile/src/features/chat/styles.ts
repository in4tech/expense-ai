import { StyleSheet } from 'react-native';

import { CHAT_TOP_OVERLAY_INSET } from '@/src/features/chat/constants';

export const chatScreenStyles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 8,
  },
  proBadge: {
    borderWidth: 1,
    borderColor: '#ECE6F7',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  proBadgeText: {
    fontSize: 14,
    color: '#5A556C',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  topActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMenuRoot: {
    flex: 1,
  },
  moreMenuDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  moreMenuPanel: {
    position: 'absolute',
    top: 98,
    right: 14,
    minWidth: 176,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
  },
  moreMenuRow: {
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  moreMenuRowText: {
    fontSize: 16,
  },
  moreMenuDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 8,
  },
  emptyStateBody: {
    flex: 1,
    paddingTop: CHAT_TOP_OVERLAY_INSET,
  },
  emptyStateBodyTemporary: {
    paddingTop: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextCrossfade: {
    position: 'relative',
    width: '100%',
  },
  heroTextCrossfadeCentered: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  heroTextCrossfadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  heroTextCrossfadeOverlayCentered: {
    alignItems: 'center',
  },
  heroTitleCentered: {
    textAlign: 'center',
    alignSelf: 'center',
    width: '100%',
    fontSize: 35,
    fontWeight: '500',
  },
  heroBodyCentered: {
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '90%',
    fontSize: 16,
  },
  heroState: {
    paddingBottom: 10,
    gap: 12,
  },
  heroTitle: {
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -0.8,
    fontWeight: '300',
  },
  heroBody: {
    fontSize: 18,
    lineHeight: 26,
    maxWidth: '90%',
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    height: 250,
  },
  /** Keep orb mounted so scale animations stay bound to native views after toggling temporary mode. */
  orbContainerHidden: {
    height: 0,
    marginVertical: 0,
    opacity: 0,
    overflow: 'hidden',
  },
  orbOuter: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    opacity: 0.45,
  },
  orbInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    opacity: 0.65,
  },
  orbIconCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPromptList: {
    gap: 10,
    paddingHorizontal: 2,
  },
  quickPromptChip: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 14,
  },
  footerHint: {
    fontSize: 14,
    color: '#8B86A0',
    marginTop: 2,
  },
  messageList: {
    flex: 1,
  },
  messageListWrap: {
    flex: 1,
    position: 'relative',
  },
  jumpToBottomWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
    pointerEvents: 'box-none',
    zIndex: 12,
  },
  jumpToBottomFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  messageListContent: {
    gap: 10,
    paddingBottom: 8,
  },
  daySeparatorRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  daySeparatorText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: '96%',
  },
  messageBubble: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    maxWidth: '92%',
  },
  messageSpeaker: {
    fontSize: 13,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  typingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  typingText: {
    fontSize: 13,
  },
  footer: {
    marginTop: 'auto',
    gap: 8,
  },
  emptySpacer: {
    flex: 1,
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  errorText: {},
  composerOuter: {
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: 6,
  },
  attachButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedPreviewRow: {
    maxWidth: '92%',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 12,
  },
  pickedThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  pickedDocIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedPreviewMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pickedKindLabel: {
    fontSize: 11,
  },
  pickedFileName: {
    flex: 1,
    fontSize: 13,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#8C7AF8',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  drawerRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdropPressable: {
    flex: 1,
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerPanel: {
    width: '78%',
    height: '100%',
    paddingTop: 56,
    paddingHorizontal: 12,
    borderRightWidth: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 18,
  },
  newChatButton: {
    backgroundColor: '#8C7AF8',
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 13,
  },
  drawerList: {
    gap: 8,
    paddingBottom: 18,
  },
  historyItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  historyMeta: {
    fontSize: 12,
  },
  emptyHistoryText: {
    fontSize: 14,
  },
});
