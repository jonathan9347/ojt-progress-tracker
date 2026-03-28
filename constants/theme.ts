import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const palette = {
  primary: '#007AFF',
  primarySoft: '#D8ECFF',
  accent: '#34C759',
  accentSoft: '#DDF7E4',
  success: '#34C759',
  warning: '#FF9F0A',
  danger: '#FF3B30',
  info: '#5AC8FA',
  ink: '#000000',
  inkSoft: '#8E8E93',
  background: '#F2F2F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F7FA',
  outline: '#C6C6C8',
  darkBackground: '#000000',
  darkSurface: '#1C1C1E',
  darkSurfaceMuted: '#2C2C2E',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    onPrimary: '#ffffff',
    primaryContainer: palette.primarySoft,
    onPrimaryContainer: palette.ink,
    secondary: palette.info,
    onSecondary: '#ffffff',
    secondaryContainer: palette.accentSoft,
    onSecondaryContainer: palette.ink,
    tertiary: palette.success,
    background: palette.background,
    surface: palette.surface,
    surfaceVariant: palette.surfaceMuted,
    onSurface: palette.ink,
    onSurfaceVariant: palette.inkSoft,
    outline: palette.outline,
    error: palette.danger,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#0A84FF',
    onPrimary: '#ffffff',
    primaryContainer: '#0B457A',
    onPrimaryContainer: '#D8ECFF',
    secondary: '#64D2FF',
    onSecondary: '#001825',
    secondaryContainer: '#10354A',
    onSecondaryContainer: '#DAF5FF',
    tertiary: '#30D158',
    background: palette.darkBackground,
    surface: palette.darkSurface,
    surfaceVariant: palette.darkSurfaceMuted,
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#98989D',
    outline: '#3A3A3C',
    error: '#FF453A',
  },
};

export const appPalette = palette;
export const appRadius = {
  xl: 32,
  lg: 24,
  md: 18,
  pill: 999,
};
