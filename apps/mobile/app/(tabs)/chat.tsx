import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useChat } from '@/src/features/chat';
import { ChatConversation, ChatMessage } from '@/src/features/chat/types';
import { useLanguage } from '@/src/i18n';
import { getChatThemeColors } from '@/src/theme/chat-colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const CHAT_TOP_OVERLAY_INSET = 100;

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const c = useMemo(() => getChatThemeColors(isDark), [isDark]);

  const listRef = useRef<FlatList<ChatMessage>>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const iconPulseAnim = useRef(new Animated.Value(1)).current;
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  const { dictionary } = useLanguage();
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
  } = useChat();

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isSending]);

  useEffect(() => {
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
    };
  }, [pulseAnim, iconPulseAnim]);

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

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardContainer, { backgroundColor: c.screen }]}>
        <View style={styles.container}>
          <View style={styles.body}>
            {hasMessages ? (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.messageListContent,
                  { paddingTop: CHAT_TOP_OVERLAY_INSET },
                ]}
                style={styles.messageList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.messageBubble,
                      item.role === 'user'
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
                    <ThemedText style={[styles.messageContent, { color: item.role === 'user' ? c.bubbleUserText : c.bubbleAssistantText }]}>
                      {item.content}
                    </ThemedText>
                  </View>
                )}
              />
            ) : (
              <View style={styles.emptyStateBody}>
                <ThemedText style={[styles.heroTitle, { color: c.heroTitle }]}>{dictionary.chat.emptyTitle}</ThemedText>
                <ThemedText style={[styles.heroBody, { color: c.heroBody }]}>{dictionary.chat.emptyBody}</ThemedText>

                <View style={styles.orbContainer}>
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
                <Pressable style={[styles.topActionButton, { backgroundColor: c.topActionBg }]}>
                  <Ionicons name="color-palette-outline" size={24} color={c.topIcon} />
                </Pressable>
                <Pressable style={[styles.topActionButton, { backgroundColor: c.topActionBg }]}>
                  <Ionicons name="moon-outline" size={24} color={c.topIcon} />
                </Pressable>
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

            <View
              style={[
                styles.inputRow,
                { backgroundColor: c.inputRowBg, borderColor: c.inputRowBorder },
              ]}>
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
  emptyStateBody: {
    flex: 1,
    paddingTop: CHAT_TOP_OVERLAY_INSET,
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
  messageListContent: {
    gap: 10,
    paddingBottom: 8,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
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
