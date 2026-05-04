import { MD3LightTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#547742',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D6E8C8',
    onPrimaryContainer: '#15240A',
    secondary: '#6A8B57',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8F1DD',
    onSecondaryContainer: '#1F2F12',
    tertiary: '#3E5A2D',
    background: '#FAFBF7',
    onBackground: '#1A1C16',
    surface: '#FFFFFF',
    onSurface: '#1A1C16',
    surfaceVariant: '#F1F4EC',
    onSurfaceVariant: '#44483D',
    outline: '#D9DCD2',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F6F8F2',
      level3: '#F1F4EC',
      level4: '#EDF1E5',
      level5: '#E8EDDE',
    },
  },
};