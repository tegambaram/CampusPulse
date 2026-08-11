import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function EmptyState({ icon = 'file-tray-outline', title, subtitle }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={34} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xxxl * 1.5,
      paddingHorizontal: SPACING.xl,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: COLORS.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.lg,
    },
    title: {
      fontSize: FONT.h4,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: FONT.small,
      color: COLORS.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
    },
  });
