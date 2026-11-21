import { createContext, useContext } from 'react';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

const light = {
  background: '#F5F5EE', surface: '#FFFFFF', text: '#192820', muted: '#53655A',
  line: '#DCE3D9', accent: '#175940', onAccent: '#FFFFFF', tint: '#E3EEDD',
  cover: '#163F31', onCover: '#F6FFF5', coverMuted: '#CBEBCC', coverLine: '#587A66',
  danger: '#A52A36',
};
const dark = {
  background: '#131B16', surface: '#202B22', text: '#F2F6EC', muted: '#B6C8B9',
  line: '#3F5143', accent: '#ACE5AE', onAccent: '#132D20', tint: '#2B4836',
  cover: '#264A36', onCover: '#FAFFF2', coverMuted: '#C9E5C6', coverLine: '#709376',
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
