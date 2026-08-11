import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function RatingStars({ rating = 0, size = 13, showValue = true, count }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.row}>
      <Ionicons name="star" size={size} color={COLORS.warning} />
      {showValue && <Text style={[styles.text, { fontSize: size }]}>{rating.toFixed(1)}</Text>}
      {count !== undefined && <Text style={[styles.count, { fontSize: size - 1 }]}>({count})</Text>}
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    text: {
      marginLeft: 4,
      fontWeight: '700',
      color: COLORS.text,
    },
    count: {
      marginLeft: 3,
      color: COLORS.textLight,
    },
  });
