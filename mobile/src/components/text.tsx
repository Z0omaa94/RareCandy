import { Text, type TextProps, type TextStyle } from 'react-native';

import { font } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

// Type scale from MASTER.md: 12 / 13 / 15 / 16-17 / 19 / 22 / 32.
const VARIANTS = {
  title: { fontFamily: font.extrabold, fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  h2: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3 },
  h3: { fontFamily: font.extrabold, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: font.bold, fontSize: 15, lineHeight: 20 },
  small: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: font.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
  number: { fontFamily: font.extrabold, fontSize: 22, lineHeight: 26, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof VARIANTS;

export function T({
  variant = 'body',
  tone = 'ink',
  color,
  style,
  ...props
}: TextProps & { variant?: TextVariant; tone?: 'ink' | 'ink2' | 'ink3'; color?: string }) {
  const t = useTheme();
  return <Text maxFontSizeMultiplier={1.6} {...props} style={[VARIANTS[variant], { color: color ?? t[tone] }, style]} />;
}
