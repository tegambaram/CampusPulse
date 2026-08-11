import React, { useMemo, useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, FONT, SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function CustomInput({
  label,
  icon,
  secureText = false,
  error,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  rightElement,
  style,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureText);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputBox,
          focused && styles.inputBoxFocused,
          error && styles.inputBoxError,
          multiline && { alignItems: 'flex-start', paddingVertical: 12 },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={19}
            color={focused ? COLORS.primary : COLORS.textLight}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, multiline && { height: 90, textAlignVertical: 'top' }]}
        />
        {secureText && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={19} color={COLORS.textLight} />
          </Pressable>
        )}
        {rightElement}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
      paddingVertical: 3,
    },
    inputBoxFocused: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.surface,
    },
    inputBoxError: {
      borderColor: COLORS.error,
    },
    input: {
      flex: 1,
      fontSize: FONT.body,
      color: COLORS.text,
      paddingVertical: 12,
    },
    errorText: {
      color: COLORS.error,
      fontSize: FONT.tiny,
      marginTop: 6,
      marginLeft: 2,
    },
  });
