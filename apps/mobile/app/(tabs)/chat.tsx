import { useEffect, useRef, useState } from 'react';
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
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useChat } from '@/src/features/chat';
import { useLanguage } from '@/src/i18n';
import { ChatConversation, ChatMessage } from '@/src/features/chat/types';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatMessageTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatScreen() {
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
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
    const animation = Animated.loop(
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

    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

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
    outputRange: [340, 0],
  });

  const backdropOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <SafeAreaView style={styles.keyboardContainer} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.topBar}>
            <Pressable style={styles.topActionButton} onPress={openHistoryDrawer}>
              <Ionicons name="menu-outline" size={16} color="#5A556C" />
            </Pressable>
            <Pressable style={styles.proBadge}>
              <Ionicons name="sparkles-outline" size={14} color="#5A556C" />
              <ThemedText style={styles.proBadgeText}>Get Pro 15%</ThemedText>
            </Pressable>
            <ThemedView style={styles.topActions}>
              <Pressable style={styles.topActionButton}>
                <Ionicons name="color-palette-outline" size={16} color="#5A556C" />
              </Pressable>
              <Pressable style={styles.topActionButton}>
                <Ionicons name="moon-outline" size={16} color="#5A556C" />
              </Pressable>
            </ThemedView>
          </ThemedView>


          {hasMessages ? (
            <ThemedView style={styles.messagesWrapper}>
              <ThemedView style={styles.chatHeaderRow}>
                <ThemedText style={styles.chatHeaderTitle}>{dictionary.chat.liveChat}</ThemedText>
              </ThemedView>
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageListContent}
                style={styles.messageList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <ThemedView
                    style={[
                      styles.messageBubble,
                      item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}>
                    <ThemedText type="defaultSemiBold" style={styles.messageSpeaker}>
                      {item.role === 'user' ? dictionary.chat.you : dictionary.chat.assistantName}
                    </ThemedText>
                    <ThemedText style={styles.messageContent}>{item.content}</ThemedText>
                    <ThemedText style={styles.messageTime}>{formatMessageTime(item.createdAt)}</ThemedText>
                  </ThemedView>
                )}
              />
            </ThemedView>
          ) : (
            <ThemedView>
              <ThemedText style={styles.heroTitle}>{dictionary.chat.emptyTitle}</ThemedText>
              <ThemedText style={styles.heroBody}>{dictionary.chat.emptyBody}</ThemedText>

              <ThemedView style={styles.orbContainer}>
                <Animated.View style={[styles.orbOuter, { transform: [{ scale: pulseAnim }] }]} />
                <Animated.View style={[styles.orbInner, { transform: [{ scale: pulseAnim }] }]} />
              </ThemedView>
            </ThemedView>
          )}

          <ThemedView style={styles.footer}>
            {!hasMessages ? (
              <ThemedView style={styles.heroState}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.quickPromptList}>
                  {dictionary.chat.quickPrompts.map((prompt) => (
                    <Pressable key={prompt} style={styles.quickPromptChip} onPress={() => sendMessage(prompt)}>
                      <ThemedText style={styles.quickPromptText}>{prompt}</ThemedText>
                    </Pressable>
                  ))}
                </ScrollView>
              </ThemedView>
            ) : null}

            {isSending ? (
              <ThemedView style={styles.typingState}>
                <ActivityIndicator size="small" color="#7B6CF6" />
                <ThemedText style={styles.typingText}>{dictionary.chat.typing}</ThemedText>
              </ThemedView>
            ) : null}

            {error ? (
              <ThemedView style={styles.errorBox}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
                <Pressable style={styles.secondaryButton} onPress={retryLastMessage}>
                  <ThemedText type="defaultSemiBold">{dictionary.chat.retry}</ThemedText>
                </Pressable>
              </ThemedView>
            ) : null}

            <ThemedView style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={dictionary.chat.inputPlaceholder}
                style={styles.composerInput}
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
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </KeyboardAvoidingView>
      <Modal visible={isDrawerMounted} transparent animationType="none" onRequestClose={closeHistoryDrawer}>
        <View style={styles.drawerRoot}>
          <Pressable style={styles.drawerBackdropPressable} onPress={closeHistoryDrawer}>
            <Animated.View style={[styles.drawerBackdrop, { opacity: backdropOpacity }]} />
          </Pressable>
          <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerTranslateX }] }]}>
            <ThemedView style={styles.drawerHeader}>
              <ThemedText type="defaultSemiBold" style={styles.drawerTitle}>
                History
              </ThemedText>
              <Pressable
                style={styles.newChatButton}
                onPress={() => {
                  startNewConversation();
                  closeHistoryDrawer();
                }}>
                <Ionicons name="add" size={14} color="#fff" />
                <ThemedText style={styles.newChatButtonText}>New</ThemedText>
              </Pressable>
            </ThemedView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerList}>
              {conversations.length === 0 ? (
                <ThemedText style={styles.emptyHistoryText}>No conversations yet.</ThemedText>
              ) : (
                conversations.map((conversation: ChatConversation) => (
                  <Pressable
                    key={conversation.id}
                    style={[
                      styles.historyItem,
                      activeConversationId === conversation.id && styles.historyItemActive,
                    ]}
                    onPress={() => {
                      loadConversation(conversation.id);
                      closeHistoryDrawer();
                    }}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>
                      {conversation.title}
                    </ThemedText>
                    <ThemedText style={styles.historyMeta}>
                      {new Date(conversation.updatedAt).toLocaleString()}
                    </ThemedText>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECE6F7',
  },
  heroState: {
    paddingBottom: 10,
    gap: 12,
  },
  heroTitle: {
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -0.8,
    color: '#2A2339',
    fontWeight: '300',
  },
  heroBody: {
    fontSize: 18,
    lineHeight: 26,
    color: '#7B758D',
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
    backgroundColor: '#E8DFFB',
    opacity: 0.45,
  },
  orbInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#C8BCF8',
    opacity: 0.65,
  },
  quickPromptList: {
    gap: 10,
    paddingHorizontal: 2,
  },
  quickPromptChip: {
    backgroundColor: '#EFE9FB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#E3DBF7',
  },
  quickPromptText: {
    fontSize: 14,
    color: '#4E4761',
  },
  footerHint: {
    fontSize: 14,
    color: '#8B86A0',
    marginTop: 2,
  },
  messagesWrapper: {
    flex: 1,
    gap: 10,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatHeaderTitle: {
    fontSize: 14,
    color: '#7D7691',
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
  userBubble: {
    alignSelf: 'flex-end',
    borderColor: '#CEC2F2',
    backgroundColor: '#EDE6FD',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderColor: '#E4DDF7',
    backgroundColor: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    color: '#8F88A4',
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
    color: '#7B6CF6',
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
    borderColor: '#FFB7C4',
    backgroundColor: '#FFF4F7',
    padding: 10,
    gap: 8,
  },
  errorText: {
    color: '#CF3C63',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E8E0F6',
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    fontSize: 15,
    color: '#443C59',
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
    borderColor: '#FF9DB2',
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
    backgroundColor: 'rgba(23, 18, 38, 0.28)',
  },
  drawerPanel: {
    width: '78%',
    height: '100%',
    backgroundColor: '#FAF7FF',
    paddingTop: 56,
    paddingHorizontal: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E6DEF8',
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
    borderColor: '#E6DEF8',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 4,
  },
  historyItemActive: {
    borderColor: '#8C7AF8',
    backgroundColor: '#F1ECFF',
  },
  historyMeta: {
    fontSize: 12,
    color: '#8D86A1',
  },
  emptyHistoryText: {
    color: '#7D7691',
    fontSize: 14,
  },
});
