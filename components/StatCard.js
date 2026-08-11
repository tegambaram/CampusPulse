import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS, FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function StatCard({ value, label, style }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: COLORS.card,
      borderRadius: RADIUS.lg,
      paddingVertical: SPACING.lg,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    value: {
      fontSize: FONT.h3,
      fontWeight: '800',
      color: COLORS.primary,
    },
    label: {
      fontSize: FONT.tiny,
      color: COLORS.textSecondary,
      marginTop: 4,
      fontWeight: '600',
    },
  });
