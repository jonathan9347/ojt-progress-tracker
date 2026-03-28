import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const palette = {
  primary: '#98D494',
  primarySoft: '#CFEFC8',
  accent: '#F5A623',
  accentSoft: '#FFE2A7',
  success: '#26B37E',
  warning: '#FDB022',
  danger: '#F97066',
  info: '#4A8CFF',
  ink: '#111B32',
  inkSoft: '#667085',
  background: '#F6F8F3',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF4EA',
  outline: '#D8E2D2',
  darkBackground: '#0F1728',
  darkSurface: '#172033',
  darkSurfaceMuted: '#243046',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.primary,
    onPrimary: '#ffffff',
    primaryContainer: palette.primarySoft,
    onPrimaryContainer: palette.ink,
    secondary: palette.accent,
    onSecondary: palette.ink,
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
    primary: '#8AC98A',
    onPrimary: '#0E1A14',
    primaryContainer: '#29503A',
    onPrimaryContainer: '#D8F2D4',
    secondary: '#F5C168',
    onSecondary: '#22180A',
    secondaryContainer: '#574016',
    onSecondaryContainer: '#FEE8B8',
    tertiary: '#68D0A6',
    background: palette.darkBackground,
    surface: palette.darkSurface,
    surfaceVariant: palette.darkSurfaceMuted,
    onSurface: '#F7FAFC',
    onSurfaceVariant: '#C0CBD9',
    outline: '#41516D',
    error: '#FF9A8A',
  },
};

export const appPalette = palette;
export const appRadius = {
  xl: 32,
  lg: 24,
  md: 18,
  pill: 999,
};
