import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/EmptyState';
import { FONT, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import bookingService from '../services/bookingService';
import { mapBooking } from '../utils/mappers';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function BookingScreen({ navigation }) {
  const { user } = useAuth();
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    bookingService
      .getMine(activeTab)
      .then((data) => setBookings(data.map((b) => mapBooking(b, user?.id))))
      .catch((err) => setError(err.message || 'Could not load bookings'))
      .finally(() => setLoading(false));
  }, [activeTab, user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleUpdateStatus = async (booking, status) => {
    setUpdatingId(booking.id);
    try {
      await bookingService.updateStatus(booking.id, status);
      load();
    } catch (err) {
      Alert.alert('Could not update booking', err.message || 'Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const data = bookings;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: SPACING.xl }} color={COLORS.primary} />
      ) : error && bookings.length === 0 ? (
        <View style={styles.centerFill}>
          <EmptyState icon="cloud-offline-outline" title="Couldn't load bookings" subtitle={error} />
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View>
              <BookingCard booking={item} />
              {item.status === 'upcoming' && (
                <View style={styles.actionsRow}>
                  {item.isProvider && (
                    <Pressable
                      style={styles.completeBtn}
                      disabled={updatingId === item.id}
                      onPress={() => handleUpdateStatus(item, 'completed')}
                    >
                      <Text style={styles.completeText}>Mark Completed</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.cancelBtn}
                    disabled={updatingId === item.id}
                    onPress={() => handleUpdateStatus(item, 'cancelled')}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState icon="calendar-outline" title={`No ${activeTab} bookings`} subtitle="Bookings you make will show up here." />
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.sm + 2,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT.small,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.white,
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
  actionsRow: {
    flexDirection: 'row',
    marginTop: -SPACING.sm,
    marginBottom: SPACING.lg,
  },
  completeBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  completeText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: FONT.small,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.errorSoft,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: FONT.small,
  },
});
