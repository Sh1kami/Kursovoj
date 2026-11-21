import { createContext, useContext } from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

const light = {
  background: '#F3F6F5', surface: '#FFFFFF', text: '#172523', muted: '#526662',
  line: '#D7E1DE', accent: '#006359', onAccent: '#FFFFFF', tint: '#D9EEE8',
  danger: '#A52A36',
};
const dark = {
  background: '#101817', surface: '#1B2725', text: '#EDF6F3', muted: '#ADBFBA',
  line: '#3C4C47', accent: '#83DCCC', onAccent: '#102C26', tint: '#203E37',
  danger: '#FF9CA1',
};

export const Palette = createContext(light);
export const usePalette = () => useContext(Palette);
export const paletteFor = (isDark: boolean) => isDark ? dark : light;

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
