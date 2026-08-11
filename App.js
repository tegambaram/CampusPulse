import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';

import RootNavigator from './navigation/RootNavigator';
import { getPaperTheme } from './constants/theme';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function AppContent() {
  const { colors: COLORS, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.surface,
      text: COLORS.text,
      border: COLORS.border,
      notification: COLORS.error,
    },
  };

  return (
    <AuthProvider>
      <PaperProvider theme={getPaperTheme(COLORS, isDark)}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={COLORS.background} />
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
