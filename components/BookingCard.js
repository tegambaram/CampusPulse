import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AvatarWithStatus from './AvatarWithStatus';
import { RADIUS, FONT, SPACING, SHADOW } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const getStatusMap = (COLORS) => ({
  upcoming: { label: 'Upcoming', color: COLORS.primary, bg: COLORS.primarySoft },
  completed: { label: 'Completed', color: COLORS.success, bg: COLORS.successSoft },
  cancelled: { label: 'Cancelled', color: COLORS.error, bg: COLORS.errorSoft },
});

export default function BookingCard({ booking }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const status = useMemo(() => getStatusMap(COLORS)[booking.status], [COLORS, booking.status]);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={styles.category}>{booking.category}</Text>
      </View>

      <Text style={styles.title}>{booking.title}</Text>

      <View style={styles.userRow}>
        <AvatarWithStatus uri={booking.withUser.avatar} size={36} showStatus={false} />
        <Text style={styles.userName}>with {booking.withUser.name}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.metaText}>{booking.date}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
          <Text style={styles.metaText}>{booking.time}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    card: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.lg,
      ...SHADOW.soft,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.sm,
    },
    statusBadge: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: RADIUS.round,
    },
    statusText: {
      fontSize: FONT.tiny,
      fontWeight: '700',
    },
    category: {
      fontSize: FONT.tiny,
      color: COLORS.textLight,
      fontWeight: '600',
    },
    title: {
      fontSize: FONT.h4,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: SPACING.md,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.md,
    },
    userName: {
      fontSize: FONT.small,
      color: COLORS.textSecondary,
      marginLeft: 10,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: SPACING.xl,
    },
    metaText: {
      fontSize: FONT.small,
      color: COLORS.textSecondary,
      marginLeft: 5,
      fontWeight: '500',
    },
  });
