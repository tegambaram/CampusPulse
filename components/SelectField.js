import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function SelectField({ label, icon, placeholder, value, options, onSelect }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.inputBox} onPress={() => setVisible(true)}>
        {icon && <Ionicons name={icon} size={19} color={COLORS.textLight} style={{ marginRight: 10 }} />}
        <Text style={[styles.valueText, !value && { color: COLORS.textLight }]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textLight} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{label || placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextActive]}>{item}</Text>
                  {item === value && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: SPACING.lg,
    },
    label: {
      fontSize: FONT.small,
      fontWeight: '600',
      color: COLORS.text,
      marginBottom: 8,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: RADIUS.md,
      borderWidth: 1.5,
      borderColor: COLORS.card,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    valueText: {
      flex: 1,
      fontSize: FONT.body,
      color: COLORS.text,
    },
    backdrop: {
      flex: 1,
      backgroundColor: COLORS.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: RADIUS.xxl,
      borderTopRightRadius: RADIUS.xxl,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
      paddingBottom: SPACING.xxxl,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: COLORS.border,
      alignSelf: 'center',
      marginBottom: SPACING.md,
    },
    sheetTitle: {
      fontSize: FONT.h4,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: SPACING.md,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.card,
    },
    optionText: {
      fontSize: FONT.body,
      color: COLORS.text,
    },
    optionTextActive: {
      color: COLORS.primary,
      fontWeight: '700',
    },
  });
