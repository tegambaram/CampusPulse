import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function SectionHeader({ title, actionLabel, onAction, style }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: SPACING.md,
    },
    title: {
      fontSize: FONT.h4,
      fontWeight: '700',
      color: COLORS.text,
    },
    action: {
      fontSize: FONT.small,
      fontWeight: '700',
      color: COLORS.primary,
    },
  });
