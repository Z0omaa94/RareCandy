import { useColorScheme } from 'react-native';

import { useSettings } from '@/store/store';

import { dark, light, type Theme } from './tokens';

export function useTheme(): Theme {
  const system = useColorScheme();
  const { theme } = useSettings();
  const isDark = theme === 'auto' ? system === 'dark' : theme === 'dark';
  return isDark ? dark : light;
}
