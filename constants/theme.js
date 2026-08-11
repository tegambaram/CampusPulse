import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  round: 999,
};

export const FONT = {
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 15,
  small: 13,
  tiny: 11,
};

// Shadows render as plain black at low opacity in both themes (a shadow doesn't need to invert
// with the palette), so this stays a static constant rather than depending on COLORS.
export const SHADOW = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  strong: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
};

// Builds a react-native-paper theme from the active palette — call with useTheme().colors /
// isDark so Paper components (Switch, etc.) restyle themselves when dark mode toggles.
export const getPaperTheme = (COLORS, isDark) => ({
  ...(isDark ? MD3DarkTheme : MD3LightTheme),
  roundness: 14,
  colors: {
    ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors),
    primary: COLORS.primary,
    onPrimary: COLORS.white,
    primaryContainer: COLORS.primarySoft,
    secondary: COLORS.exchange,
    background: COLORS.background,
    surface: COLORS.surface,
    surfaceVariant: COLORS.card,
    outline: COLORS.border,
    error: COLORS.error,
    onSurface: COLORS.text,
    onSurfaceVariant: COLORS.textSecondary,
  },
});

export default { SPACING, RADIUS, FONT, SHADOW, getPaperTheme };
