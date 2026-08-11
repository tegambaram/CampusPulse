import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ConversationItem from '../components/ConversationItem';
import EmptyState from '../components/EmptyState';
import { FONT, SPACING, RADIUS } from '../constants/theme';
import conversationService from '../services/conversationService';
import { mapConversation } from '../utils/mappers';
import useSocket from '../hooks/useSocket';
import { useTheme } from '../context/ThemeContext';

export default function MessagesScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const load = useCallback(() => {
    setError(null);
    conversationService
      .getConversations()
      .then((data) => setConversations(data.map(mapConversation)))
      .catch((err) => setError(err.message || 'Could not load conversations'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!socket) return undefined;
    const onOnline = ({ userId }) =>
      setConversations((prev) => prev.map((c) => (c.user.id === userId ? { ...c, online: true } : c)));
    const onOffline = ({ userId }) =>
      setConversations((prev) => prev.map((c) => (c.user.id === userId ? { ...c, online: false } : c)));
    const onMessage = () => load();

    socket.on('user_online', onOnline);
    socket.on('user_offline', onOffline);
    socket.on('receive_message', onMessage);

    return () => {
      socket.off('user_online', onOnline);
      socket.off('user_offline', onOffline);
      socket.off('receive_message', onMessage);
    };
  }, [socket, load]);

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => c.user.name.toLowerCase().includes(q));
  }, [query, conversations]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Messages</Text>
          {totalUnread > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadPillText}>{totalUnread} new</Text>
            </View>
          )}
        </View>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color={COLORS.textLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search chats..."
            placeholderTextColor={COLORS.textLight}
            style={styles.input}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
      ) : error && conversations.length === 0 ? (
        <View style={styles.centerFill}>
          <EmptyState icon="cloud-offline-outline" title="Couldn't load messages" subtitle={error} />
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ConversationItem conversation={item} onPress={(c) => navigation.navigate('Chat', { conversation: c })} />
          )}
          ListEmptyComponent={
            <EmptyState icon="chatbubbles-outline" title="No conversations found" subtitle="Start connecting with students to see chats here." />
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT.h1,
    fontWeight: '800',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  unreadPill: {
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.round,
  },
  unreadPillText: {
    fontSize: FONT.tiny,
    color: COLORS.primary,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: FONT.small,
    color: COLORS.text,
    paddingVertical: 11,
    marginLeft: 8,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT.small,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.card,
  },
});
