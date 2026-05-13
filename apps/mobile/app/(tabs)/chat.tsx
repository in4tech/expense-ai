import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  useColorScheme,
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
  SCROLL_NEAR_BOTTOM_PX,
} from "@/src/features/chat/constants";
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

import { useLanguage } from "@/src/i18n";
import { Ionicons } from "@expo/vector-icons";
import { getChatThemeColors } from "@/src/theme/chat-colors";

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const c = useMemo(() => getChatThemeColors(isDark), [isDark]);

  const listRef = useRef<FlatList<ChatListItem>>(null);
  const atBottomRef = useRef(true);
  const scrollToEndRafRef = useRef<number | null>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const { dictionary, language } = useLanguage();
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
    pulseAnim,
    iconPulseAnim,
    heroOpacityRegular,
    heroOpacityTemporary,
    heroTranslateRegular,
    heroTranslateTemporary,
    isDrawerMounted,
    drawerTranslateX,
    backdropOpacity,
    openHistoryDrawer,
    closeHistoryDrawer,
  } = useChatScreenAnimations({ hasMessages, temporaryMode });

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
    if (streamingStatus === "searching_documents") {
      return dictionary.chat.statusSearchingDocuments;
    }
    if (streamingStatus === "reading_pdf") {
      return dictionary.chat.statusReadingPdf;
    }
    if (streamingStatus === "generating_answer") {
      return dictionary.chat.statusGeneratingAnswer;
    }
    return dictionary.chat.typing;
  }, [
    streamingStatus,
    dictionary.chat.statusSearchingDocuments,
    dictionary.chat.statusReadingPdf,
    dictionary.chat.statusGeneratingAnswer,
    dictionary.chat.typing,
  ]);

  const updateScrollBottomFlag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      if (contentSize.height <= layoutMeasurement.height + 8) {
        atBottomRef.current = true;
        setShowJumpToBottom(false);
        return;
      }
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      const atBottom = distanceFromBottom <= SCROLL_NEAR_BOTTOM_PX;
      atBottomRef.current = atBottom;
      setShowJumpToBottom(!atBottom);
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
          /* error surfaced via useChat */
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
          await uploadPdf({
            uri: attachmentToSend.uri,
            name: attachmentToSend.name,
            mimeType: attachmentToSend.mimeType,
          });
        } catch {
          /* useChat sets error */
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
        Alert.alert("", dictionary.chat.pickFileFailed);
        return;
      }
      const trimmed = composed?.trim();
      if (!trimmed) return;
      try {
        await sendMessage(trimmed);
      } catch {
        /* useChat sets error */
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
                pulseAnim={pulseAnim}
                iconPulseAnim={iconPulseAnim}
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
