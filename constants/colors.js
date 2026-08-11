export const LIGHT_COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  primarySoft: '#EFF6FF',

  background: '#FFFFFF',
  surface: '#FFFFFF',
  card: '#F8FAFC',
  cardAlt: '#F1F5F9',
  border: '#E2E8F0',

  text: '#0F172A',
  textSecondary: '#64748B',
  textLight: '#94A3B8',
  white: '#FFFFFF',

  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  error: '#EF4444',
  errorSoft: '#FEE2E2',

  free: '#16A34A',
  freeSoft: '#DCFCE7',
  paid: '#2563EB',
  paidSoft: '#DBEAFE',
  rent: '#F59E0B',
  rentSoft: '#FEF3C7',
  exchange: '#8B5CF6',
  exchangeSoft: '#EDE9FE',

  online: '#22C55E',
  offline: '#94A3B8',
  overlay: 'rgba(15, 23, 42, 0.55)',
  shadow: '#1E293B',
};

// Dark palette — mirrors every key in LIGHT_COLORS so any screen can swap the whole object without
// missing a value. Soft/*Soft tones are darkened+desaturated card fills (not just dimmed light
// tones) so text drawn on top of them stays readable; the accent hues themselves are lifted a
// notch to keep contrast against the near-black background.
export const DARK_COLORS = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#60A5FA',
  primarySoft: '#132A4D',

  background: '#0B1220',
  surface: '#111A2E',
  card: '#1A2540',
  cardAlt: '#212F4E',
  border: '#2E3B58',

  text: '#F1F5F9',
  textSecondary: '#A3B0C7',
  textLight: '#6B7994',
  white: '#FFFFFF',

  success: '#22C55E',
  successSoft: '#12321F',
  warning: '#FBBF24',
  warningSoft: '#3A2B0D',
  error: '#F87171',
  errorSoft: '#3A1616',

  free: '#22C55E',
  freeSoft: '#12321F',
  paid: '#3B82F6',
  paidSoft: '#132A4D',
  rent: '#FBBF24',
  rentSoft: '#3A2B0D',
  exchange: '#A78BFA',
  exchangeSoft: '#2C2352',

  online: '#22C55E',
  offline: '#6B7994',
  overlay: 'rgba(0, 0, 0, 0.65)',
  shadow: '#000000',
};

// Static default kept for any code path that runs before ThemeProvider mounts (e.g. module-scope
// constants). Screens/components should prefer `useTheme().colors` so they react to the toggle.
export const COLORS = LIGHT_COLORS;

export default COLORS;
