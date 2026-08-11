import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT, RADIUS, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function MessageBubble({ message }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const isMe = message.sender === 'me';

  return (
    <View style={[styles.row, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleMe : styles.bubbleThem,
        ]}
      >
        <Text style={[styles.text, { color: isMe ? COLORS.white : COLORS.text }]}>{message.text}</Text>
      </View>
      <Text style={[styles.time, { alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>{message.time}</Text>
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    row: {
      marginBottom: SPACING.md,
      width: '100%',
    },
    bubble: {
      maxWidth: '78%',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: RADIUS.lg,
    },
    bubbleMe: {
      backgroundColor: COLORS.primary,
      borderBottomRightRadius: 4,
      alignSelf: 'flex-end',
    },
    bubbleThem: {
      backgroundColor: COLORS.card,
      borderBottomLeftRadius: 4,
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: FONT.body,
      lineHeight: 20,
    },
    time: {
      fontSize: FONT.tiny,
      color: COLORS.textLight,
      marginTop: 4,
      marginHorizontal: 4,
    },
  });
