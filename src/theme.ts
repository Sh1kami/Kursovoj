import { createContext, useContext, useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import Storage from 'expo-sqlite/kv-store';
import { Appearance, useColorScheme } from 'react-native';

const light = {
  background: '#F5F8FE', surface: '#FFFFFF', text: '#102440', muted: '#4B607C',
  line: '#D9E4F4', accent: '#174FC1', onAccent: '#FFFFFF', tint: '#E8F0FF',
  cover: '#E0EBFF', onCover: '#132C56', coverMuted: '#3A5781', coverLine: '#B2C8EF',
  danger: '#AE3044',
};
const dark = {
  background: '#0C1525', surface: '#142237', text: '#F1F6FF', muted: '#B5C6DF',
  line: '#314462', accent: '#9CC3FF', onAccent: '#102642', tint: '#1C365D',
  cover: '#172F54', onCover: '#F5F8FF', coverMuted: '#B6CFF5', coverLine: '#4E6E9D',
  danger: '#FF9CA1',
};

export const Palette = createContext(light);
export const usePalette = () => useContext(Palette);
export const paletteFor = (isDark: boolean) => isDark ? dark : light;

export type ThemePreference = 'system' | 'light' | 'dark';
const preferenceKey = 'appearance:theme';

function readThemePreference(): ThemePreference {
  try {
    const value = Storage.getItemSync(preferenceKey);
    if (value === 'light' || value === 'dark') return value;
  } catch (error) {
    console.warn('Не вдалося завантажити тему.', error);
  }
  return 'system';
}

export function useAppearancePreference() {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState(readThemePreference);
  const dark = (preference === 'system' ? systemScheme : preference) === 'dark';

  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'auto' : preference);
  }, [preference]);

  function selectTheme(next: ThemePreference) {
    if (next === preference) return;
    Storage.setItemSync(preferenceKey, next);
    setPreference(next);
  }

  return { preference, selectTheme, dark };
}

export const AppearancePreference = createContext<ReturnType<typeof useAppearancePreference> | null>(null);

export function useThemePreference() {
  const value = useContext(AppearancePreference);
  if (!value) throw new Error('Налаштування вигляду недоступні.');
  return value;
}

export function navigationTheme(isDark: boolean) {
  const palette = paletteFor(isDark);
  return {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      primary: palette.accent,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.line,
      notification: palette.danger,
    },
  };
}
