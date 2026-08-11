import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import NotificationItem from '../components/NotificationItem';
import EmptyState from '../components/EmptyState';
import { FONT, SPACING } from '../constants/theme';
import notificationService from '../services/notificationService';
import { mapNotification } from '../utils/mappers';
import useSocket from '../hooks/useSocket';
import { useTheme } from '../context/ThemeContext';

const ROUTE_MAP = {
  booking: 'Booking',
  message: 'Messages',
  request: 'Booking',
  profile: 'MainTabs',
};

export default function NotificationsScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();

  const load = useCallback(() => {
    setError(null);
    notificationService
      .getNotifications()
      .then((res) => setNotifications(res.data.map(mapNotification)))
      .catch((err) => setError(err.message || 'Could not load notifications'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!socket) return undefined;
    const onNotification = (raw) => setNotifications((prev) => [mapNotification(raw), ...prev]);
    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [socket]);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationService.markAllRead();
    } catch (err) {
      /* optimistic UI already applied */
    }
  };

  const handlePress = async (notification) => {
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
    notificationService.markRead(notification.id).catch(() => {});
    const target = ROUTE_MAP[notification.type];
    if (target) navigation.navigate(target);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Pressable onPress={markAllRead} hitSlop={10}>
          <Text style={styles.markAll}>Mark all read</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
      ) : error && notifications.length === 0 ? (
        <View style={styles.centerFill}>
          <EmptyState icon="cloud-offline-outline" title="Couldn't load notifications" subtitle={error} />
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <NotificationItem notification={item} onPress={handlePress} />}
          ListEmptyComponent={<EmptyState icon="notifications-outline" title="You're all caught up" subtitle="No new notifications right now." />}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT.h3,
    fontWeight: '800',
    color: COLORS.text,
  },
  markAll: {
    fontSize: FONT.small,
    color: COLORS.primary,
    fontWeight: '700',
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
    borderRadius: 12,
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
});
