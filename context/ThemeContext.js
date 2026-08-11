import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_COLORS, DARK_COLORS } from '../constants/colors';

const ThemeContext = createContext(null);

// Same key SettingsScreen has always written the toggle to, so an existing local install's saved
// preference is picked up automatically rather than resetting to light on the next app update.
const DARK_MODE_KEY = 'setting:darkMode';

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(DARK_MODE_KEY)
      .then((value) => {
        if (value !== null) setIsDark(value === 'true');
      })
      .finally(() => setIsThemeLoaded(true));
  }, []);

  const setDarkMode = (value) => {
    setIsDark(value);
    AsyncStorage.setItem(DARK_MODE_KEY, String(value));
  };

  const toggleDarkMode = () => setDarkMode(!isDark);

  const colors = useMemo(() => (isDark ? DARK_COLORS : LIGHT_COLORS), [isDark]);

  const value = useMemo(
    () => ({ isDark, colors, setDarkMode, toggleDarkMode, isThemeLoaded }),
    [isDark, colors, isThemeLoaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
