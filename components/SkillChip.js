import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function SkillChip({ label, onRemove, style }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={[styles.chip, style]}>
      <Text style={styles.text}>{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8} style={{ marginLeft: 6 }}>
          <Ionicons name="close-circle" size={16} color={COLORS.primary} />
        </Pressable>
      )}
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primarySoft,
      paddingVertical: 7,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.round,
      marginRight: SPACING.sm,
      marginBottom: SPACING.sm,
    },
    text: {
      fontSize: FONT.small,
      fontWeight: '600',
      color: COLORS.primary,
    },
  });
