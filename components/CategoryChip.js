import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function CategoryChip({ label, icon, active, onPress, style }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive, style]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={15}
          color={active ? COLORS.white : COLORS.primary}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.text, { color: active ? COLORS.white : COLORS.text }]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.round,
      marginRight: SPACING.sm,
      borderWidth: 1.5,
    },
    chipActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    chipInactive: {
      backgroundColor: COLORS.white,
      borderColor: COLORS.border,
    },
    text: {
      fontSize: FONT.small,
      fontWeight: '600',
    },
  });
