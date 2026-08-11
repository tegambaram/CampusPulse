import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import AvatarWithStatus from './AvatarWithStatus';
import { FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function ConversationItem({ conversation, onPress }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { user, lastMessage, time, unreadCount, online } = conversation;
  const unread = unreadCount > 0;

  return (
    <Pressable onPress={() => onPress && onPress(conversation)} style={styles.row}>
      <AvatarWithStatus uri={user.avatar} size={56} online={online} />
      <View style={styles.middle}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
          <Text style={[styles.time, unread && { color: COLORS.primary, fontWeight: '700' }]}>{time}</Text>
        </View>
        <View style={styles.bottomLine}>
          <Text
            style={[styles.message, unread && { color: COLORS.text, fontWeight: '600' }]}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
          {unread && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: SPACING.md,
    },
    middle: {
      flex: 1,
      marginLeft: SPACING.md,
    },
    topLine: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    name: {
      fontSize: FONT.body,
      fontWeight: '700',
      color: COLORS.text,
      flex: 1,
      marginRight: 8,
    },
    time: {
      fontSize: FONT.tiny,
      color: COLORS.textLight,
    },
    bottomLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 3,
    },
    message: {
      fontSize: FONT.small,
      color: COLORS.textSecondary,
      flex: 1,
      marginRight: 8,
    },
    badge: {
      backgroundColor: COLORS.primary,
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    badgeText: {
      color: COLORS.white,
      fontSize: FONT.tiny,
      fontWeight: '700',
    },
  });
