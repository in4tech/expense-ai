import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  TextInput,
  useColorScheme,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { buildChatListWithDaySeparators, type ChatListItem } from '@/src/features/chat/helpers';
import { CHAT_TOP_OVERLAY_INSET, SCROLL_NEAR_BOTTOM_PX } from '@/src/features/chat/constants';
import { chatScreenStyles as styles } from '@/src/features/chat/styles';
import { composeOutgoingMessage } from '@/src/features/chat/compose-attachment-message';
import { useChat } from '@/src/features/chat';
import { useChatScreenAttachments } from '@/src/features/chat/hooks/use-attachments';
import { ChatConversation } from '@/src/features/chat/types';
import { useLanguage } from '@/src/i18n';
import { getChatThemeColors } from '@/src/theme/chat-colors';

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = useMemo(() => getChatThemeColors(isDark), [isDark]);

  const listRef = useRef<FlatList<ChatListItem>>(null);
  const atBottomRef = useRef(true);
  const scrollToEndRafRef = useRef<number | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
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
    error,
    sendMessage,
    uploadPdf,
    retryLastMessage,
    loadConversation,
    startNewConversation,
    temporaryMode,
    toggleTemporaryChatMode,
    discardActiveConversation,
  } = useChat();

  const { pickedAttachment, setPickedAttachment, openAttachmentMenu, beginNewConversation } =
    useChatScreenAttachments({
      isSending,
      chat: dictionary.chat,
      cancelLabel: dictionary.settings.cancel,
      startNewConversation,
    });

  const heroBlendRef = useRef<Animated.Value | null>(null);
  if (heroBlendRef.current === null) {
    heroBlendRef.current = new Animated.Value(temporaryMode ? 1 : 0);
  }
  const heroBlend = heroBlendRef.current;

  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const isFirstHeroBlendMount = useRef(true);

  const chatListData = useMemo(() => {
    const visible = messages.filter((m) => !(m.role === 'assistant' && m.content.trim() === ''));
    return buildChatListWithDaySeparators(visible, language, {
      today: dictionary.chat.today,
      yesterday: dictionary.chat.yesterday,
    });
  }, [messages, language, dictionary.chat.today, dictionary.chat.yesterday]);

  const composerCanSend =
    (input.trim().length > 0 || pickedAttachment != null) && !isSending;

  const updateScrollBottomFlag = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentSize.height <= layoutMeasurement.height + 8) {
      atBottomRef.current = true;
      setShowJumpToBottom(false);
      return;
    }
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    const atBottom = distanceFromBottom <= SCROLL_NEAR_BOTTOM_PX;
    atBottomRef.current = atBottom;
    setShowJumpToBottom(!atBottom);
  }, []);

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
      if (prompt != null && prompt.trim() !== '') {
        try {
          await sendMessage(prompt);
        } catch {
          /* error surfaced via useChat */
        }
        return;
      }
      const inputToSend = input;
      if (inputToSend.trim().length > 0) {
        setInput('');
      }
      const attachmentToSend = pickedAttachment;
      if (attachmentToSend) {
        // Clear picked file immediately when user taps Send.
        setPickedAttachment(null);
      }
      if (
        attachmentToSend &&
        attachmentToSend.kind === 'document' &&
        ((attachmentToSend.mimeType || '').toLowerCase() === 'application/pdf' ||
          attachmentToSend.name.toLowerCase().endsWith('.pdf'))
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
        Alert.alert('', dictionary.chat.pickFileFailed);
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
    [sendMessage, uploadPdf, input, pickedAttachment, dictionary.chat, setPickedAttachment]
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

  useEffect(() => {
    if (isFirstHeroBlendMount.current) {
      isFirstHeroBlendMount.current = false;
      heroBlend.setValue(temporaryMode ? 1 : 0);
      return;
    }
    heroBlend.stopAnimation();
    Animated.timing(heroBlend, {
      toValue: temporaryMode ? 1 : 0,
      duration: 280,
      easing: Easing.bezier(0.33, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [temporaryMode, heroBlend]);

  useEffect(() => {
    if (hasMessages) {
      pulseAnim.stopAnimation();
      iconPulseAnim.stopAnimation();
      return undefined;
    }

    pulseAnim.setValue(1);
    iconPulseAnim.setValue(1);

    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const iconLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulseAnim, {
          toValue: 1.12,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconPulseAnim, {
          toValue: 1,
          duration: 520,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    orbLoop.start();
    iconLoop.start();
    return () => {
      orbLoop.stop();
      iconLoop.stop();
      pulseAnim.stopAnimation();
      iconPulseAnim.stopAnimation();
    };
  }, [hasMessages, pulseAnim, iconPulseAnim]);

  const openHistoryDrawer = () => {
    setIsDrawerMounted(true);
    Animated.timing(drawerAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeHistoryDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsDrawerMounted(false);
      }
    });
  };

  const drawerTranslateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-340, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const shareConversationText = useCallback(() => {
    return messages
      .filter((m) => m.content.trim())
      .map((m) =>
        m.role === 'user' ? `${dictionary.chat.you}: ${m.content}` : `${dictionary.chat.assistantName}: ${m.content}`
      )
      .join('\n\n');
  }, [messages, dictionary.chat.you, dictionary.chat.assistantName]);

  const heroOpacityRegular = heroBlend.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });
  const heroOpacityTemporary = heroBlend.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const heroTranslateRegular = heroBlend.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const heroTranslateTemporary = heroBlend.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardContainer, { backgroundColor: c.screen }]}>
        <View style={styles.container}>
          <View style={styles.body}>
            {hasMessages ? (
              <View style={styles.messageListWrap}>
                <FlatList
                  ref={listRef}
                  data={chatListData}
                  keyExtractor={(item) => (item.type === 'day' ? item.id : item.message.id)}
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
                  removeClippedSubviews={Platform.OS === 'android'}
                  onContentSizeChange={scheduleScrollToEndIfAtBottom}
                  renderItem={({ item }) =>
                    item.type === 'day' ? (
                      <View style={styles.daySeparatorRow}>
                        <ThemedText style={[styles.daySeparatorText, { color: c.textMuted }]} numberOfLines={2}>
                          {item.label}
                        </ThemedText>
                      </View>
                    ) : (
                      (() => {
                        const meta = (item.message.metadata ?? {}) as Record<string, unknown>;
                        const pdfFilename =
                          String(meta.filename ?? item.message.content ?? '').trim() || 'PDF file';
                        const isUserPdfMessage =
                          item.message.role === 'user' &&
                          meta.type === 'pdf' &&
                          pdfFilename.trim().length > 0;
                        if (isUserPdfMessage) {
                          return (
                            <View
                              style={[
                                styles.pickedPreviewRow,
                                {
                                  maxWidth: '92%',
                                  alignSelf: 'flex-end',
                                  backgroundColor: isDark
                                    ? 'rgba(140,122,248,0.16)'
                                    : '#F3EEFF',
                                  borderColor: isDark
                                    ? 'rgba(140,122,248,0.36)'
                                    : '#D8CCFF',
                                },
                              ]}>
                              <View style={[styles.pickedDocIcon, { backgroundColor: c.inputRowBg, borderColor: c.inputRowBorder }]}>
                                <Ionicons
                                  name="document-text-outline"
                                  size={22}
                                  color={c.topIcon}
                                />
                              </View>
                              <View style={styles.pickedPreviewMeta}>
                                <ThemedText
                                  numberOfLines={2}
                                  style={[styles.pickedFileName, { color: c.text }]}>
                                  {pdfFilename}
                                </ThemedText>
                                <ThemedText numberOfLines={1} style={[styles.pickedKindLabel, { color: c.textMuted }]}>
                                  PDF
                                </ThemedText>
                              </View>
                            </View>
                          );
                        }
                        return (
                          <View
                            style={[
                              styles.messageBubble,
                              item.message.role === 'user'
                                ? {
                                  alignSelf: 'flex-end',
                                  borderColor: c.userBubbleBorder,
                                  backgroundColor: c.userBubbleBg,
                                }
                                : {
                                  alignSelf: 'flex-start',
                                  borderColor: c.assistantBubbleBorder,
                                  backgroundColor: c.assistantBubbleBg,
                                },
                            ]}>
                            <ThemedText
                              style={[
                                styles.messageContent,
                                {
                                  color:
                                    item.message.role === 'user' ? c.bubbleUserText : c.bubbleAssistantText,
                                },
                              ]}>
                              {item.message.content}
                            </ThemedText>
                          </View>
                        );
                      })()
                    )
                  }
                />
                {showJumpToBottom ? (
                  <View style={styles.jumpToBottomWrap} pointerEvents="box-none">
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
                      ]}>
                      <Ionicons name="chevron-down" size={22} color={c.topIcon} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ) : (
              <View
                style={[
                  styles.emptyStateBody,
                  temporaryMode && styles.emptyStateBodyTemporary,
                ]}>
                <View style={[styles.heroTextCrossfade, temporaryMode && styles.heroTextCrossfadeCentered]}>
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      opacity: heroOpacityRegular,
                      transform: [{ translateY: heroTranslateRegular }],
                    }}>
                    <ThemedText
                      style={[
                        styles.heroTitle,
                        { color: c.heroTitle },
                        temporaryMode && styles.heroTitleCentered,
                      ]}>
                      {dictionary.chat.emptyTitle}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.heroBody,
                        { color: c.heroBody },
                        temporaryMode && styles.heroBodyCentered,
                      ]}>
                      {dictionary.chat.emptyBody}
                    </ThemedText>
                  </Animated.View>
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      styles.heroTextCrossfadeOverlay,
                      temporaryMode && styles.heroTextCrossfadeOverlayCentered,
                      {
                        opacity: heroOpacityTemporary,
                        transform: [{ translateY: heroTranslateTemporary }],
                      },
                    ]}>
                    <ThemedText
                      style={[
                        styles.heroTitle,
                        { color: c.heroTitle },
                        temporaryMode && styles.heroTitleCentered,
                      ]}>
                      {dictionary.chat.temporaryChatTitle}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.heroBody,
                        { color: c.heroBody },
                        temporaryMode && styles.heroBodyCentered,
                      ]}>
                      {dictionary.chat.temporaryChatBody}
                    </ThemedText>
                  </Animated.View>
                </View>

                <View
                  style={[styles.orbContainer, temporaryMode && styles.orbContainerHidden]}
                  pointerEvents={temporaryMode ? 'none' : 'auto'}
                  accessibilityElementsHidden={temporaryMode}
                  importantForAccessibility={temporaryMode ? 'no-hide-descendants' : 'auto'}>
                  <Animated.View style={[styles.orbOuter, { backgroundColor: c.orbOuter, transform: [{ scale: pulseAnim }] }]} />
                  <Animated.View style={[styles.orbInner, { backgroundColor: c.orbInner, transform: [{ scale: pulseAnim }] }]} />
                  <View style={styles.orbIconCenter} pointerEvents="none">
                    <Animated.View style={{ transform: [{ scale: iconPulseAnim }] }}>
                      <MaterialCommunityIcons name="robot-outline" size={40} color={c.robotIcon} />
                    </Animated.View>
                  </View>
                </View>
              </View>
            )}
            <View style={[styles.topBar, styles.topBarOverlay]} pointerEvents="box-none">
              <Pressable style={[styles.topActionButton, { backgroundColor: c.topActionBg }]} onPress={openHistoryDrawer}>
                <Ionicons name="menu-outline" size={24} color={c.topIcon} />
              </Pressable>
              <View style={styles.topActions}>
                {hasMessages ? (
                  <>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={dictionary.chat.newChatA11y}
                      style={[styles.topActionButton, { backgroundColor: c.topActionBg }]}
                      onPress={() => {
                        setMoreMenuOpen(false);
                        beginNewConversation();
                      }}>
                      <Ionicons name="add" size={26} color={c.topIcon} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={dictionary.chat.moreMenuA11y}
                      style={[styles.topActionButton, { backgroundColor: c.topActionBg }]}
                      onPress={() => setMoreMenuOpen((open) => !open)}>
                      <Ionicons name="ellipsis-horizontal" size={22} color={c.topIcon} />
                    </Pressable>
                  </>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={dictionary.chat.temporaryChatA11y}
                    style={[
                      styles.topActionButton,
                      { backgroundColor: c.topActionBg },
                      temporaryMode && { borderWidth: 2, borderColor: c.historyItemActiveBorder },
                    ]}
                    onPress={toggleTemporaryChatMode}>
                    <Ionicons name="flash-outline" size={24} color={c.topIcon} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            {!hasMessages ? (
              <View style={styles.heroState}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickPromptList}>
                  {dictionary.chat.quickPrompts.map((prompt) => (
                    <Pressable
                      key={prompt}
                      style={[
                        styles.quickPromptChip,
                        { backgroundColor: c.quickChipBg, borderColor: c.quickChipBorder },
                      ]}
                      onPress={() => void handleSendMessage(prompt)}>
                      <ThemedText style={[styles.quickPromptText, { color: c.quickChipText }]}>{prompt}</ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {isSending ? (
              <View style={styles.typingState}>
                <ActivityIndicator size="small" color={c.typing} />
                <ThemedText style={[styles.typingText, { color: c.typing }]}>{dictionary.chat.typing}</ThemedText>
              </View>
            ) : null}

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  { borderColor: c.errorBorder, backgroundColor: c.errorBg },
                ]}>
                <ThemedText style={[styles.errorText, { color: c.errorText }]}>{error}</ThemedText>
                <Pressable style={[styles.secondaryButton, { borderColor: c.secondaryBorder }]} onPress={handleRetryLastMessage}>
                  <ThemedText type="defaultSemiBold">{dictionary.chat.retry}</ThemedText>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.composerOuter}>
              {pickedAttachment ? (
                <View
                  style={[
                    styles.pickedPreviewRow,
                    {
                      backgroundColor: isDark ? 'rgba(140,122,248,0.16)' : '#F3EEFF',
                      borderColor: isDark ? 'rgba(140,122,248,0.36)' : '#D8CCFF',
                    },
                  ]}>
                  {pickedAttachment.kind === 'image' ? (
                    <Image
                      source={{ uri: pickedAttachment.uri }}
                      style={styles.pickedThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.pickedDocIcon, { backgroundColor: c.inputRowBg, borderColor: c.inputRowBorder }]}>
                      <Ionicons name="document-text-outline" size={22} color={c.topIcon} />
                    </View>
                  )}
                  <View style={styles.pickedPreviewMeta}>
                    <ThemedText numberOfLines={1} style={[styles.pickedFileName, { color: c.textSecondary }]}>
                      {pickedAttachment.name}
                    </ThemedText>
                    <ThemedText numberOfLines={1} style={[styles.pickedKindLabel, { color: c.textMuted }]}>
                      {pickedAttachment.kind === 'image'
                        ? dictionary.chat.pickedKindImage
                        : dictionary.chat.pickedKindDocument}
                    </ThemedText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={dictionary.chat.removeAttachment}
                    onPress={() => setPickedAttachment(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={22} color={c.textMuted} />
                  </Pressable>
                </View>
              ) : null}
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: c.inputRowBg, borderColor: c.inputRowBorder },
                ]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={dictionary.chat.attachFile}
                  onPress={openAttachmentMenu}
                  disabled={isSending}
                  hitSlop={10}
                  style={[styles.attachButton, isSending && styles.buttonDisabled]}>
                  <Ionicons name="add-circle-outline" size={24} color={c.topIcon} />
                </Pressable>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={dictionary.chat.inputPlaceholder}
                  placeholderTextColor={c.textMuted}
                  style={[styles.composerInput, { color: c.composerText }]}
                  multiline={false}
                  maxLength={1000}
                  editable={!isSending}
                />
                <Pressable
                  style={[styles.primaryButton, !composerCanSend && styles.buttonDisabled]}
                  disabled={!composerCanSend}
                  onPress={() => void handleSendMessage()}>
                  <Ionicons name="send" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <Modal visible={isDrawerMounted} transparent animationType="none" onRequestClose={closeHistoryDrawer}>
        <View style={styles.drawerRoot}>
          <Animated.View
            style={[
              styles.drawerPanel,
              {
                backgroundColor: c.drawerPanel,
                borderRightColor: c.drawerPanelBorder,
                transform: [{ translateX: drawerTranslateX }],
              },
            ]}>
            <View style={styles.drawerHeader}>
              <ThemedText type="defaultSemiBold" style={[styles.drawerTitle, { color: c.text }]}>
                Recents
              </ThemedText>
              <Pressable
                style={styles.newChatButton}
                onPress={() => {
                  beginNewConversation();
                  closeHistoryDrawer();
                }}>
                <Ionicons name="add" size={14} color="#fff" />
                <ThemedText style={styles.newChatButtonText}>New Chat</ThemedText>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerList}>
              {conversations.length === 0 ? (
                <ThemedText style={[styles.emptyHistoryText, { color: c.textMuted }]}>No conversations yet.</ThemedText>
              ) : (
                conversations.map((conversation: ChatConversation) => (
                  <Pressable
                    key={conversation.id}
                    style={[
                      styles.historyItem,
                      {
                        borderColor: c.historyItemBorder,
                        backgroundColor: c.historyItemBg,
                      },
                      activeConversationId === conversation.id && {
                        borderColor: c.historyItemActiveBorder,
                        backgroundColor: c.historyItemActiveBg,
                      },
                    ]}
                    onPress={() => {
                      void loadConversation(conversation.id);
                      closeHistoryDrawer();
                    }}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1} style={{ color: c.text }}>
                      {conversation.title}
                    </ThemedText>
                    <ThemedText style={[styles.historyMeta, { color: c.historyMeta }]}>
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Animated.View>
          <Pressable style={styles.drawerBackdropPressable} onPress={closeHistoryDrawer}>
            <Animated.View style={[styles.drawerBackdrop, { opacity: backdropOpacity, backgroundColor: c.drawerBackdrop }]} />
          </Pressable>
        </View>
      </Modal>

      <Modal visible={moreMenuOpen} transparent animationType="fade" onRequestClose={() => setMoreMenuOpen(false)}>
        <View style={styles.moreMenuRoot}>
          <Pressable style={styles.moreMenuDismiss} onPress={() => setMoreMenuOpen(false)} />
          <View
            style={[
              styles.moreMenuPanel,
              {
                backgroundColor: c.inputRowBg,
                borderColor: c.inputRowBorder,
              },
            ]}>
            <Pressable
              style={styles.moreMenuRow}
              onPress={() => {
                setMoreMenuOpen(false);
                Alert.alert(
                  dictionary.chat.deleteConfirmTitle,
                  dictionary.chat.deleteConfirmMessage,
                  [
                    { text: dictionary.settings.cancel, style: 'cancel' },
                    {
                      text: dictionary.chat.menuDelete,
                      style: 'destructive',
                      onPress: () => discardActiveConversation(),
                    },
                  ]
                );
              }}>
              <ThemedText style={[styles.moreMenuRowText, { color: c.errorText }]}>{dictionary.chat.menuDelete}</ThemedText>
            </Pressable>
            <View style={[styles.moreMenuDivider, { backgroundColor: c.inputRowBorder }]} />
            <Pressable
              style={styles.moreMenuRow}
              onPress={() => {
                setMoreMenuOpen(false);
                Alert.alert(dictionary.chat.reportAckTitle, dictionary.chat.reportAckMessage);
              }}>
              <ThemedText style={[styles.moreMenuRowText, { color: c.composerText }]}>{dictionary.chat.menuReport}</ThemedText>
            </Pressable>
            <View style={[styles.moreMenuDivider, { backgroundColor: c.inputRowBorder }]} />
            <Pressable
              style={styles.moreMenuRow}
              onPress={() => {
                setMoreMenuOpen(false);
                void (async () => {
                  try {
                    const message = shareConversationText();
                    if (!message.trim()) {
                      return;
                    }
                    await Share.share({ message });
                  } catch {
                    Alert.alert('', dictionary.chat.shareFailed);
                  }
                })();
              }}>
              <ThemedText style={[styles.moreMenuRowText, { color: c.composerText }]}>{dictionary.chat.menuShare}</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
