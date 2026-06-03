import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import {
  buildChatListWithDaySeparators,
  type ChatListItem,
} from "@/src/features/chat/helpers";
import {
  CHAT_TOP_OVERLAY_INSET,
  SCROLL_LOAD_MORE_TRIGGER_PX,
  SCROLL_NEAR_BOTTOM_PX,
} from "@/src/features/chat/constants";
import { ThemedText } from "@/components/themed-text";
import { chatScreenStyles as styles } from "@/src/features/chat/styles";
import { composeOutgoingMessage } from "@/src/features/chat/compose-attachment-message";
import {
  useChat,
  useChatScreenAnimations,
  useChatScreenAttachments,
} from "@/src/features/chat/hooks";
import {
  ChatAttachmentPickerSheet,
  ChatComposerAttachmentPreview,
  ChatComposerInputRow,
  ChatComposerStatus,
  ChatEmptyState,
  ChatHistoryDrawerModal,
  ChatMoreMenuModal,
  ChatQuickPrompts,
  ChatScreenHeader,
  ChatFlatListItem,
} from "@/src/features/chat/components";

import { useToast } from "@/components/toast";
import { useLanguage } from "@/src/i18n";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "@/src/theme";

export default function ChatScreen() {
  const { chat: c, isDark } = useAppTheme();

  const listRef = useRef<FlatList<ChatListItem>>(null);
  const atBottomRef = useRef(true);
  const scrollToEndRafRef = useRef<number | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const { dictionary, language } = useLanguage();
  const { showToast } = useToast();
  const {
    messages,
    hasMessages,
    conversations,
    activeConversationId,
    input,
    setInput,
    isSending,
    streamingStatus,
    error,
    sendMessage,
    uploadPdf,
    retryLastMessage,
    loadConversation,
    startNewConversation,
    temporaryMode,
    toggleTemporaryChatMode,
    deleteActiveConversation,
    refreshConversationHistory,
    isRefreshingConversations,
    hasMoreOlderMessages,
    isLoadingOlderMessages,
    loadOlderMessages,
  } = useChat();

  const {
    pickedAttachment,
    setPickedAttachment,
    openAttachmentMenu,
    beginNewConversation,
    attachmentPickerOpen,
    closeAttachmentPicker,
    pickPhotoFromSheet,
    pickDocumentFromSheet,
  } = useChatScreenAttachments({
    isSending,
    chat: dictionary.chat,
    startNewConversation,
  });

  const {
    heroOpacityRegular,
    heroOpacityTemporary,
    heroTranslateRegular,
    heroTranslateTemporary,
    isDrawerMounted,
    drawerTranslateX,
    backdropOpacity,
    openHistoryDrawer,
    closeHistoryDrawer,
  } = useChatScreenAnimations({ temporaryMode });

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const chatListData = useMemo(() => {
    const visible = messages.filter(
      (m) => !(m.role === "assistant" && m.content.trim() === ""),
    );
    return buildChatListWithDaySeparators(visible, language, {
      today: dictionary.chat.today,
      yesterday: dictionary.chat.yesterday,
    });
  }, [messages, language, dictionary.chat.today, dictionary.chat.yesterday]);

  const composerCanSend =
    (input.trim().length > 0 || pickedAttachment != null) && !isSending;

  const typingStatusText = useMemo(() => {
    if (streamingStatus === "planning") {
      return dictionary.chat.statusPlanning;
    }
    if (streamingStatus === "reading_pdf") {
      return dictionary.chat.statusReadingPdf;
    }
    if (streamingStatus === "searching_web") {
      return dictionary.chat.statusSearchingWeb;
    }
    if (streamingStatus === "generating_answer") {
      return dictionary.chat.statusGeneratingAnswer;
    }
    return dictionary.chat.typing;
  }, [
    streamingStatus,
    dictionary.chat.statusReadingPdf,
    dictionary.chat.statusSearchingWeb,
    dictionary.chat.statusGeneratingAnswer,
    dictionary.chat.typing,
  ]);

  // Latest-value refs so the scroll handler can fire `loadOlderMessages` without
  // recreating the callback (which would re-bind FlatList's onScroll every render).
  const loadOlderMessagesRef = useRef(loadOlderMessages);
  loadOlderMessagesRef.current = loadOlderMessages;
  const canLoadOlderRef = useRef(false);
  canLoadOlderRef.current =
    hasMoreOlderMessages && !isLoadingOlderMessages && !isSending;

  const updateScrollBottomFlag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const fitsViewport = contentSize.height <= layoutMeasurement.height + 8;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      const atBottom =
        fitsViewport || distanceFromBottom <= SCROLL_NEAR_BOTTOM_PX;
      atBottomRef.current = atBottom;
      // Avoid setState churn (and parent re-render during streaming) when value is unchanged.
      setShowJumpToBottom((prev) => (prev === !atBottom ? prev : !atBottom));

      // Trigger pagination when user reaches near the top of the list.
      if (
        canLoadOlderRef.current &&
        !fitsViewport &&
        contentOffset.y <= SCROLL_LOAD_MORE_TRIGGER_PX
      ) {
        void loadOlderMessagesRef.current();
      }
    },
    [],
  );

  const scrollToLatest = useCallback(() => {
    atBottomRef.current = true;
    setShowJumpToBottom(false);
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  /** Coalesce layout-driven scrolls (long lists + streaming) to one scroll per frame, no layout animation cost. */
  const scheduleScrollToEndIfAtBottom = useCallback(() => {
    if (!atBottomRef.current) {
      return;
    }
    if (scrollToEndRafRef.current != null) {
      cancelAnimationFrame(scrollToEndRafRef.current);
    }
    scrollToEndRafRef.current = requestAnimationFrame(() => {
      scrollToEndRafRef.current = null;
      listRef.current?.scrollToEnd({ animated: false });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollToEndRafRef.current != null) {
        cancelAnimationFrame(scrollToEndRafRef.current);
        scrollToEndRafRef.current = null;
      }
    };
  }, []);

  const handleSendMessage = useCallback(
    async (prompt?: string) => {
      atBottomRef.current = true;
      setShowJumpToBottom(false);
      if (prompt != null && prompt.trim() !== "") {
        try {
          await sendMessage(prompt);
        } catch {
          showToast({
            status: "error",
            title: dictionary.chat.chatActionFailed,
            durationMs: 3200,
          });
        }
        return;
      }
      const inputToSend = input;
      if (inputToSend.trim().length > 0) {
        setInput("");
      }
      const attachmentToSend = pickedAttachment;
      if (attachmentToSend) {
        // Clear picked file immediately when user taps Send.
        setPickedAttachment(null);
      }
      if (
        attachmentToSend &&
        attachmentToSend.kind === "document" &&
        ((attachmentToSend.mimeType || "").toLowerCase() ===
          "application/pdf" ||
          attachmentToSend.name.toLowerCase().endsWith(".pdf"))
      ) {
        try {
          await uploadPdf(
            {
              uri: attachmentToSend.uri,
              name: attachmentToSend.name,
              mimeType: attachmentToSend.mimeType,
            },
            inputToSend,
          );
        } catch {
          showToast({
            status: "error",
            title: dictionary.chat.chatActionFailed,
            durationMs: 3200,
          });
        }
        return;
      }

      let composed: string | null = null;
      try {
        composed = await composeOutgoingMessage(inputToSend, attachmentToSend, {
          imageAttachDefaultNote: dictionary.chat.imageAttachDefaultNote,
          binaryDocumentFallback: dictionary.chat.binaryDocumentFallback,
        });
      } catch {
        showToast({
          status: "error",
          title: dictionary.chat.composeMessageFailed,
          durationMs: 3200,
        });
        return;
      }
      const trimmed = composed?.trim();
      if (!trimmed) return;
      try {
        await sendMessage(trimmed);
      } catch {
        showToast({
          status: "error",
          title: dictionary.chat.chatActionFailed,
          durationMs: 3200,
        });
      }
    },
    [
      sendMessage,
      uploadPdf,
      input,
      pickedAttachment,
      dictionary.chat,
      setInput,
      setPickedAttachment,
      showToast,
    ],
  );

  const handleRetryLastMessage = useCallback(() => {
    atBottomRef.current = true;
    setShowJumpToBottom(false);
    void retryLastMessage();
  }, [retryLastMessage]);

  useEffect(() => {
    if (!hasMessages) {
      setShowJumpToBottom(false);
      atBottomRef.current = true;
      return;
    }
    atBottomRef.current = true;
    setShowJumpToBottom(false);
    const id = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, [activeConversationId, hasMessages]);

  useEffect(() => {
    if (!hasMessages) {
      setMoreMenuOpen(false);
    }
  }, [hasMessages]);

  const shareConversationText = useCallback(() => {
    return messages
      .filter((m) => m.content.trim())
      .map((m) =>
        m.role === "user"
          ? `${dictionary.chat.you}: ${m.content}`
          : `${dictionary.chat.assistantName}: ${m.content}`,
      )
      .join("\n\n");
  }, [messages, dictionary.chat.you, dictionary.chat.assistantName]);

  const handleHeaderNewChat = useCallback(() => {
    setMoreMenuOpen(false);
    beginNewConversation();
  }, [beginNewConversation]);

  const handleToggleMoreMenu = useCallback(() => {
    setMoreMenuOpen((open) => !open);
  }, []);

  const handleSelectQuickPrompt = useCallback(
    (prompt: string) => {
      void handleSendMessage(prompt);
    },
    [handleSendMessage],
  );

  const handleRemovePickedAttachment = useCallback(() => {
    setPickedAttachment(null);
  }, [setPickedAttachment]);

  const handleRefreshConversationHistory = useCallback(() => {
    void refreshConversationHistory();
  }, [refreshConversationHistory]);

  const handleDrawerPickConversation = useCallback(
    (conversationId: string) => {
      void loadConversation(conversationId);
    },
    [loadConversation],
  );

  const closeMoreMenuModal = useCallback(() => {
    setMoreMenuOpen(false);
  }, []);

  const handleMoreMenuDeleteActiveConversation = useCallback(() => {
    void deleteActiveConversation();
  }, [deleteActiveConversation]);

  const chatListKeyExtractor = useCallback((item: ChatListItem) => {
    return item.type === "day" ? item.id : item.message.id;
  }, []);

  const renderChatListItem = useCallback(
    function renderChatListItem(info: ListRenderItemInfo<ChatListItem>) {
      return <ChatFlatListItem item={info.item} isDark={isDark} colors={c} />;
    },
    [isDark, c],
  );

  const listHeader = useMemo(() => {
    if (!hasMoreOlderMessages && !isLoadingOlderMessages) {
      return null;
    }
    return (
      <View style={styles.loadMoreHeader}>
        {isLoadingOlderMessages ? (
          <View style={styles.loadMoreInner}>
            <ActivityIndicator size="small" color={c.topIcon} />
            <ThemedText
              style={[styles.loadMoreText, { color: c.textMuted }]}
              numberOfLines={1}
            >
              {dictionary.chat.loadingMore}
            </ThemedText>
          </View>
        ) : null}
      </View>
    );
  }, [
    hasMoreOlderMessages,
    isLoadingOlderMessages,
    c.topIcon,
    c.textMuted,
    dictionary.chat.loadingMore,
  ]);

  /**
   * Preserve viewport when older messages are prepended. `minIndexForVisible: 1`
   * lets the loading header (index 0) appear/disappear without nudging the view.
   */
  const maintainVisibleContentPosition = useMemo(
    () => ({ minIndexForVisible: 1, autoscrollToTopThreshold: undefined }),
    [],
  );

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={[styles.keyboardContainer, { backgroundColor: c.screen }]}
      >
        <View style={styles.container}>
          <View style={styles.body}>
            {hasMessages ? (
              <View style={styles.messageListWrap}>
                <FlatList
                  ref={listRef}
                  data={chatListData}
                  keyExtractor={chatListKeyExtractor}
                  contentContainerStyle={[
                    styles.messageListContent,
                    { paddingTop: CHAT_TOP_OVERLAY_INSET },
                  ]}
                  style={styles.messageList}
                  showsVerticalScrollIndicator={false}
                  onScroll={updateScrollBottomFlag}
                  scrollEventThrottle={32}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  updateCellsBatchingPeriod={50}
                  removeClippedSubviews={Platform.OS === "android"}
                  onContentSizeChange={scheduleScrollToEndIfAtBottom}
                  renderItem={renderChatListItem}
                  ListHeaderComponent={listHeader}
                  maintainVisibleContentPosition={
                    maintainVisibleContentPosition
                  }
                />
                {showJumpToBottom ? (
                  <View
                    style={styles.jumpToBottomWrap}
                    pointerEvents="box-none"
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={dictionary.chat.scrollToLatest}
                      onPress={scrollToLatest}
                      style={[
                        styles.jumpToBottomFab,
                        {
                          backgroundColor: c.inputRowBg,
                          borderColor: c.inputRowBorder,
                        },
                      ]}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={22}
                        color={c.topIcon}
                      />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : (
              <ChatEmptyState
                temporaryMode={temporaryMode}
                colors={c}
                heroOpacityRegular={heroOpacityRegular}
                heroOpacityTemporary={heroOpacityTemporary}
                heroTranslateRegular={heroTranslateRegular}
                heroTranslateTemporary={heroTranslateTemporary}
                copy={{
                  emptyTitle: dictionary.chat.emptyTitle,
                  emptyBody: dictionary.chat.emptyBody,
                  temporaryChatTitle: dictionary.chat.temporaryChatTitle,
                  temporaryChatBody: dictionary.chat.temporaryChatBody,
                }}
              />
            )}

            <ChatScreenHeader
              colors={c}
              hasMessages={hasMessages}
              temporaryMode={temporaryMode}
              onOpenHistory={openHistoryDrawer}
              onNewChat={handleHeaderNewChat}
              onToggleMoreMenu={handleToggleMoreMenu}
              onToggleTemporaryChat={toggleTemporaryChatMode}
              labels={{
                newChatA11y: dictionary.chat.newChatA11y,
                moreMenuA11y: dictionary.chat.moreMenuA11y,
                temporaryChatA11y: dictionary.chat.temporaryChatA11y,
              }}
            />
          </View>

          <View style={styles.footer}>
            {!hasMessages ? (
              <ChatQuickPrompts
                prompts={dictionary.chat.quickPrompts}
                sectionTitle={dictionary.chat.quickPromptsTitle}
                colors={c}
                onSelectPrompt={handleSelectQuickPrompt}
              />
            ) : null}

            <ChatComposerStatus
              isSending={isSending}
              typingStatusText={typingStatusText}
              error={error}
              colors={c}
              retryLabel={dictionary.chat.retry}
              onRetry={handleRetryLastMessage}
            />

            <View style={styles.composerOuter}>
              <ChatComposerAttachmentPreview
                attachment={pickedAttachment}
                isDark={isDark}
                colors={c}
                pickedKindImageLabel={dictionary.chat.pickedKindImage}
                pickedKindDocumentLabel={dictionary.chat.pickedKindDocument}
                removeAttachmentA11y={dictionary.chat.removeAttachment}
                onRemove={handleRemovePickedAttachment}
              />

              <ChatComposerInputRow
                colors={c}
                value={input}
                onChangeText={setInput}
                placeholder={dictionary.chat.inputPlaceholder}
                attachFileA11y={dictionary.chat.attachFile}
                isSending={isSending}
                canSend={composerCanSend}
                onOpenAttachmentMenu={openAttachmentMenu}
                onSend={handleSendMessage}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ChatHistoryDrawerModal
        visible={isDrawerMounted}
        onRequestClose={closeHistoryDrawer}
        colors={c}
        drawerTranslateX={drawerTranslateX}
        backdropOpacity={backdropOpacity}
        conversations={conversations}
        activeConversationId={activeConversationId}
        isRefreshingConversations={isRefreshingConversations}
        onRefreshHistory={handleRefreshConversationHistory}
        onPickConversation={handleDrawerPickConversation}
        onNewChat={beginNewConversation}
        chat={{
          recentsTitle: dictionary.chat.recentsTitle,
          refreshHistoryA11y: dictionary.chat.refreshHistoryA11y,
          newChatButton: dictionary.chat.newChatButton,
          noConversations: dictionary.chat.noConversations,
        }}
      />

      <ChatAttachmentPickerSheet
        visible={attachmentPickerOpen}
        onRequestClose={closeAttachmentPicker}
        colors={c}
        title={dictionary.chat.attachMenuTitle}
        photoLabel={dictionary.chat.attachMenuPhoto}
        documentLabel={dictionary.chat.attachMenuDocument}
        cancelLabel={dictionary.settings.cancel}
        onPickPhoto={pickPhotoFromSheet}
        onPickDocument={pickDocumentFromSheet}
      />

      <ChatMoreMenuModal
        visible={moreMenuOpen}
        onRequestClose={closeMoreMenuModal}
        colors={c}
        cancelLabel={dictionary.settings.cancel}
        onDeleteActiveConversation={handleMoreMenuDeleteActiveConversation}
        chat={{
          moreMenuTitle: dictionary.chat.moreMenuTitle,
          deleteConfirmTitle: dictionary.chat.deleteConfirmTitle,
          deleteServerConfirmMessage:
            dictionary.chat.deleteServerConfirmMessage,
          menuDelete: dictionary.chat.menuDelete,
          reportAckTitle: dictionary.chat.reportAckTitle,
          reportAckMessage: dictionary.chat.reportAckMessage,
          menuReport: dictionary.chat.menuReport,
          menuShare: dictionary.chat.menuShare,
          shareFailed: dictionary.chat.shareFailed,
        }}
        shareConversationText={shareConversationText}
      />
    </View>
  );
}
