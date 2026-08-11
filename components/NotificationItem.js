import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, FONT, SPACING, SHADOW } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const getTypeColorMap = (COLORS) => ({
  booking: { color: COLORS.success, bg: COLORS.successSoft },
  message: { color: COLORS.primary, bg: COLORS.primarySoft },
  request: { color: COLORS.warning, bg: COLORS.warningSoft },
  profile: { color: COLORS.exchange, bg: COLORS.exchangeSoft },
});

export default function NotificationItem({ notification, onPress }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const typeColorMap = useMemo(() => getTypeColorMap(COLORS), [COLORS]);
  const tone = typeColorMap[notification.type] || typeColorMap.message;

  return (
    <Pressable
      onPress={() => onPress && onPress(notification)}
      style={[styles.card, !notification.read && styles.unreadCard]}
    >
      <View style={[styles.iconWrap, { backgroundColor: tone.bg }]}>
        <Ionicons name={notification.icon} size={20} color={tone.color} />
      </View>
      <View style={styles.textWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{notification.title}</Text>
          {!notification.read && <View style={styles.dot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        <Text style={styles.time}>{notification.time}</Text>
      </View>
    </Pressable>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      ...SHADOW.soft,
    },
    unreadCard: {
      backgroundColor: COLORS.primarySoft,
      shadowOpacity: 0,
      elevation: 0,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: SPACING.md,
    },
    textWrap: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: FONT.small,
      fontWeight: '700',
      color: COLORS.text,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COLORS.primary,
      marginLeft: 6,
    },
    message: {
      fontSize: FONT.small,
      color: COLORS.textSecondary,
      marginTop: 3,
      lineHeight: 18,
    },
    time: {
      fontSize: FONT.tiny,
      color: COLORS.textLight,
      marginTop: 6,
    },
  });
