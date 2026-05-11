import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useChat } from '@/src/features/chat';
import { ChatMessage } from '@/src/features/chat/types';
import { SafeAreaView } from 'react-native-safe-area-context';

const QUICK_PROMPTS = [
  'Cho mình mẹo tiết kiệm chi tiêu hằng tháng.',
  'Gợi ý cách phân chia ngân sách theo 50/30/20.',
  'Làm sao để theo dõi các khoản chi nhỏ mỗi ngày?',
];

const formatMessageTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatScreen() {
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const {
    messages,
    hasMessages,
    input,
    setInput,
    isSending,
    canSend,
    error,
    sendMessage,
    retryLastMessage,
    clearConversation,
  } = useChat();

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, isSending]);

  return (
    <SafeAreaView style={styles.keyboardContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="title" style={styles.title}>
              Chat AI
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Trò chuyện với trợ lý tài chính.
            </ThemedText>
          </ThemedView>

          {!hasMessages ? (
            <ThemedView style={styles.emptyState}>
              <ThemedText style={styles.emptyTitle}>Bắt đầu cuộc trò chuyện</ThemedText>
              <ThemedText style={styles.emptyBody}>
                Bạn có thể dùng câu hỏi nhanh bên dưới hoặc nhập câu hỏi ở ô chat.
              </ThemedText>
              <ThemedView style={styles.quickPromptList}>
                {QUICK_PROMPTS.map((prompt) => (
                  <Pressable key={prompt} style={styles.quickPromptChip} onPress={() => sendMessage(prompt)}>
                    <ThemedText>{prompt}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            </ThemedView>
          ) : (
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
                  <ThemedText type="defaultSemiBold">{item.role === 'user' ? 'Bạn' : 'AI Assistant'}</ThemedText>
                  <ThemedText>{item.content}</ThemedText>
                  <ThemedText style={styles.messageTime}>{formatMessageTime(item.createdAt)}</ThemedText>
                </ThemedView>
              )}
            />
          )}

          {isSending ? (
            <ThemedView style={styles.typingState}>
              <ActivityIndicator size="small" />
              <ThemedText>AI đang trả lời...</ThemedText>
            </ThemedView>
          ) : null}

          {error ? (
            <ThemedView style={styles.errorBox}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <Pressable style={styles.secondaryButton} onPress={retryLastMessage}>
                <ThemedText type="defaultSemiBold">Gửi lại tin nhắn gần nhất</ThemedText>
              </Pressable>
            </ThemedView>
          ) : null}

          <ThemedView style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Nhập tin nhắn..."
              style={styles.composerInput}
              multiline
              maxLength={1000}
              editable={!isSending}
            />
            <Pressable
              style={[styles.primaryButton, !canSend && styles.buttonDisabled]}
              disabled={!canSend}
              onPress={() => sendMessage()}>
              <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
                Gửi
              </ThemedText>
            </Pressable>
          </ThemedView>

          {/* {hasMessages ? (
            <Pressable style={styles.clearButton} onPress={clearConversation}>
              <ThemedText type="defaultSemiBold">Xóa cuộc trò chuyện</ThemedText>
            </Pressable>
          ) : null} */}
        </ThemedView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    // paddingBottom: 20,
    gap: 10,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b3b3b3',
    padding: 12,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    opacity: 0.85,
  },
  quickPromptList: {
    gap: 8,
    marginTop: 4,
  },
  quickPromptChip: {
    borderWidth: 1,
    borderColor: '#b3b3b3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    gap: 10,
    paddingBottom: 4,
  },
  messageBubble: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 4,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderColor: '#0a7ea4',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderColor: '#999',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  typingState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  errorBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d32f2f',
    padding: 10,
    gap: 8,
  },
  errorText: {
    color: '#d32f2f',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 44,
    maxHeight: 120,
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  clearButton: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
