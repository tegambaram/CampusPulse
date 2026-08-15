import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AvatarWithStatus from '../components/AvatarWithStatus';
import MessageBubble from '../components/MessageBubble';
import ReportModal from '../components/ReportModal';
import { FONT, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import conversationService from '../services/conversationService';
import userService from '../services/userService';
import { mapMessage } from '../utils/mappers';
import useSocket from '../hooks/useSocket';

export default function ChatScreen({ route, navigation }) {
  const { conversation } = route.params;
  const { user, blockedUserIds, refreshBlockedUsers } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [online, setOnline] = useState(conversation.online);
  const [reportVisible, setReportVisible] = useState(false);
  const [reporting, setReporting] = useState(false);
  const listRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    conversationService
      .getMessages(conversation.id)
      .then((res) => setMessages(res.data.map((m) => mapMessage(m, user?.id))))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [conversation.id]);

  useEffect(() => {
    if (!socket) return undefined;
    socket.emit('join_conversation', conversation.id);
    socket.emit('message_read', { conversationId: conversation.id });

    const onReceive = (raw) => {
      const message = mapMessage(raw, user?.id);
      const rawConversationId = (raw.conversation?._id || raw.conversation || '').toString();
      if (rawConversationId && rawConversationId !== conversation.id) return;
      setMessages((prev) => [...prev, message]);
      if (message.sender === 'them') setRemoteTyping(false);
    };
    const onTyping = ({ conversationId }) => {
      if (conversationId === conversation.id) setRemoteTyping(true);
    };
    const onStopTyping = ({ conversationId }) => {
      if (conversationId === conversation.id) setRemoteTyping(false);
    };
    const onOnline = ({ userId }) => userId === conversation.user.id && setOnline(true);
    const onOffline = ({ userId }) => userId === conversation.user.id && setOnline(false);
    const onSendError = ({ conversationId, message }) => {
      if (conversationId === conversation.id) Alert.alert('Message not sent', message);
    };

    socket.on('receive_message', onReceive);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);
    socket.on('user_online', onOnline);
    socket.on('user_offline', onOffline);
    socket.on('send_message_error', onSendError);

    return () => {
      socket.emit('leave_conversation', conversation.id);
      socket.off('receive_message', onReceive);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
      socket.off('user_online', onOnline);
      socket.off('user_offline', onOffline);
      socket.off('send_message_error', onSendError);
    };
  }, [socket, conversation.id, user?.id]);

  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages, remoteTyping]);

  const handleChangeText = (value) => {
    setText(value);
    if (!socket) return;
    socket.emit('typing', { conversationId: conversation.id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: conversation.id });
    }, 1200);
  };

  const handleBlockUser = () => {
    const isBlocked = blockedUserIds.includes(conversation.user.id);
    Alert.alert(
      isBlocked ? 'Unblock this user?' : 'Block this user?',
      isBlocked
        ? `${conversation.user.name} will be able to message you again.`
        : `You won't be able to message ${conversation.user.name} and they won't be able to message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              await userService.toggleBlock(conversation.user.id);
              await refreshBlockedUsers();
              if (isBlocked) {
                Alert.alert('User unblocked', `${conversation.user.name} has been unblocked.`);
              } else {
                Alert.alert('User blocked', `${conversation.user.name} has been blocked.`, [
                  { text: 'OK', onPress: () => navigation.goBack() },
                ]);
              }
            } catch (err) {
              Alert.alert('Could not update block status', err.message || 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReportSubmit = async ({ reason, details }, closeModal) => {
    setReporting(true);
    try {
      await userService.reportUser(conversation.user.id, { reason, details });
      closeModal();
      Alert.alert('Report submitted', "Thanks for letting us know — we'll look into it.");
    } catch (err) {
      Alert.alert('Could not submit report', err.message || 'Please try again.');
    } finally {
      setReporting(false);
    }
  };

  const handleMoreOptions = () => {
    const isBlocked = blockedUserIds.includes(conversation.user.id);
    Alert.alert(conversation.user.name, undefined, [
      { text: 'Report User', onPress: () => setReportVisible(true) },
      { text: isBlocked ? 'Unblock User' : 'Block User', style: 'destructive', onPress: handleBlockUser },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket?.emit('stop_typing', { conversationId: conversation.id });

    if (socket && socket.connected) {
      socket.emit('send_message', { conversationId: conversation.id, text: trimmed });
    } else {
      try {
        const message = await conversationService.sendMessage(conversation.id, trimmed);
        setMessages((prev) => [...prev, mapMessage(message, user?.id)]);
      } catch (err) {
        setText(trimmed);
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>
          <AvatarWithStatus uri={conversation.user.avatar} size={40} online={online} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.name} numberOfLines={1}>{conversation.user.name}</Text>
            <Text style={styles.status}>{remoteTyping ? 'Typing...' : online ? 'Online' : 'Offline'}</Text>
          </View>
          <Pressable hitSlop={10} style={styles.iconBtn} onPress={handleMoreOptions}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.primary} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ListFooterComponent={
              remoteTyping ? (
                <View style={styles.typingRow}>
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingDots}>●  ●  ●</Text>
                  </View>
                </View>
              ) : null
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={text}
            onChangeText={handleChangeText}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={18} color={COLORS.white} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmit={handleReportSubmit}
        submitting={reporting}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  status: {
    fontSize: FONT.tiny,
    color: COLORS.textLight,
    marginTop: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  typingRow: {
    alignItems: 'flex-start',
    marginTop: 2,
  },
  typingBubble: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  typingDots: {
    color: COLORS.textLight,
    fontSize: 10,
    letterSpacing: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FONT.body,
    color: COLORS.text,
    maxHeight: 100,
    marginRight: SPACING.sm,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
