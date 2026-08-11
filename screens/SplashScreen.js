import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONT, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen({ navigation }) {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed && !isLoading) {
      navigation.replace(isAuthenticated ? 'MainTabs' : 'Welcome');
    }
  }, [minTimeElapsed, isLoading, isAuthenticated]);

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.logoCircle, { opacity, transform: [{ scale }] }]}>
        <Ionicons name="pulse" size={48} color={COLORS.primary} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity }]}>CampusPulse</Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Connecting Students. Sharing Skills.
      </Animated.Text>
    </LinearGradient>
  );
}

const createStyles = (COLORS) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: COLORS.white,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: SPACING.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    title: {
      fontSize: FONT.h1 + 6,
      fontWeight: '800',
      color: COLORS.white,
      letterSpacing: 0.5,
    },
    tagline: {
      fontSize: FONT.small,
      color: COLORS.white,
      opacity: 0.9,
      marginTop: SPACING.sm,
      fontWeight: '500',
    },
  });
