import React, { useMemo, useRef } from 'react';
import { Text, StyleSheet, Animated, Pressable, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, FONT, SHADOW } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

export default function CustomButton({
  title,
  onPress,
  variant = 'primary', // primary | outline | text | google
  icon,
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? COLORS.white : COLORS.primary} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={19}
              color={variant === 'primary' ? COLORS.white : variant === 'google' ? COLORS.text : COLORS.primary}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.text,
              variant === 'primary' && { color: COLORS.white },
              variant === 'outline' && { color: COLORS.primary },
              variant === 'text' && { color: COLORS.primary },
              variant === 'google' && { color: COLORS.text },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }, style]}>
      <Pressable
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        style={({ pressed }) => [
          variant === 'outline' && styles.outline,
          variant === 'text' && styles.textOnly,
          variant === 'google' && styles.google,
          disabled && { opacity: 0.5 },
        ]}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={[COLORS.primaryLight, COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primary}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    paddingVertical: 15,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.medium,
    shadowColor: COLORS.primary,
  },
  outline: {
    paddingVertical: 15,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  textOnly: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  google: {
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  text: {
    fontSize: FONT.body,
    fontWeight: '700',
  },
});

