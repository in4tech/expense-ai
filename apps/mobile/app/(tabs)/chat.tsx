import * as DocumentPicker from 'expo-document-picker';
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
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useChat } from '@/src/features/chat';
import { ChatConversation, ChatMessage } from '@/src/features/chat/types';
import { useLanguage } from '@/src/i18n';
import { getChatThemeColors } from '@/src/theme/chat-colors';

const CHAT_TOP_OVERLAY_INSET = 100;
const SCROLL_NEAR_BOTTOM_PX = 120;

type ChatListItem =
  | { type: 'day'; id: string; label: string }
  | { type: 'message'; message: ChatMessage };

function localDayStartMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function formatDaySeparatorLabel(
  iso: string,
  language: 'en' | 'vn',
  labels: { today: string; yesterday: string }
): string {
  const date = new Date(iso);
  const dayStart = localDayStartMs(date);
  const now = new Date();
  const todayStart = localDayStartMs(now);
  const yesterdayRef = new Date(now);
  yesterdayRef.setDate(yesterdayRef.getDate() - 1);
  const yesterdayStart = localDayStartMs(yesterdayRef);

  const locale = language === 'vn' ? 'vi-VN' : 'en-US';
  const timeStr = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  let dayPart: string;
  if (dayStart === todayStart) {
    dayPart = labels.today;
  } else if (dayStart === yesterdayStart) {
    dayPart = labels.yesterday;
  } else {
    dayPart = date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return `${dayPart} · ${timeStr}`;
}

function buildChatListWithDaySeparators(
  rows: ChatMessage[],
  language: 'en' | 'vn',
  labels: { today: string; yesterday: string }
): ChatListItem[] {
  const items: ChatListItem[] = [];
  let prevDayStart: number | null = null;

  for (const message of rows) {
    const dayStart = localDayStartMs(new Date(message.createdAt));
    if (prevDayStart === null || dayStart !== prevDayStart) {
      items.push({
        type: 'day',
        id: `day-${dayStart}-${message.id}`,
        label: formatDaySeparatorLabel(message.createdAt, language, labels),
      });
      prevDayStart = dayStart;
    }
    items.push({ type: 'message', message });
  }

  return items;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = useMemo(() => getChatThemeColors(isDark), [isDark]);

  const listRef = useRef<FlatList<ChatListItem>>(null);
  const atBottomRef = useRef(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string } | null>(null);
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
    canSend,
    error,
    sendMessage,
    retryLastMessage,
    loadConversation,
    startNewConversation,
    temporaryMode,
    toggleTemporaryChatMode,
    discardActiveConversation,
  } = useChat();

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

  const pickAttachment = useCallback(async () => {
    if (isSending) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      setPickedFile({ uri: asset.uri, name: asset.name });
    } catch {
      Alert.alert('', dictionary.chat.pickFileFailed);
    }
  }, [isSending, dictionary.chat.pickFileFailed]);

  const lastMessage = messages[messages.length - 1];

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
    if (atBottomRef.current) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [chatListData.length, isSending, lastMessage?.content]);

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
                  scrollEventThrottle={16}
                  onContentSizeChange={() => {
                    if (atBottomRef.current) {
                      listRef.current?.scrollToEnd({ animated: false });
                    }
                  }}
                  renderItem={({ item }) =>
                    item.type === 'day' ? (
                      <View style={styles.daySeparatorRow}>
                        <ThemedText style={[styles.daySeparatorText, { color: c.textMuted }]} numberOfLines={2}>
                          {item.label}
                        </ThemedText>
                      </View>
                    ) : (
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
                        startNewConversation();
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
                      onPress={() => sendMessage(prompt)}>
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
                <Pressable style={[styles.secondaryButton, { borderColor: c.secondaryBorder }]} onPress={retryLastMessage}>
                  <ThemedText type="defaultSemiBold">{dictionary.chat.retry}</ThemedText>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.composerOuter}>
              <View
                style={[
                  styles.inputRow,
                  { backgroundColor: c.inputRowBg, borderColor: c.inputRowBorder },
                ]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={dictionary.chat.attachFile}
                  onPress={pickAttachment}
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
                  style={[styles.primaryButton, !canSend && styles.buttonDisabled]}
                  disabled={!canSend}
                  onPress={() => sendMessage()}>
                  <Ionicons name="send" size={16} color="#fff" />
                </Pressable>
              </View>
              {pickedFile ? (
                <View style={styles.pickedFileBar}>
                  <ThemedText numberOfLines={1} style={[styles.pickedFileName, { color: c.textSecondary }]}>
                    {pickedFile.name}
                  </ThemedText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={dictionary.chat.removeAttachment}
                    onPress={() => setPickedFile(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close-circle" size={22} color={c.textMuted} />
                  </Pressable>
                </View>
              ) : null}
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
                  startNewConversation();
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

const styles = StyleSheet.create({
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
    fontWeight: "500"
  },
  heroBodyCentered: {
    textAlign: 'center',
    alignSelf: 'center',
    maxWidth: '90%',
    fontSize: 16
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
  pickedFileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
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
