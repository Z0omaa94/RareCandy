// Design tokens from design-system/rarecandy/MASTER.md (Ocean Breeze palette).
// Light theme proportions: 35 % background, 30 % mint, 25 % blue, 10 % navy.

export const palette = {
  navy: '#0B3D91',
  blue: '#3BA7F2',
  mint: '#7FE7D6',
  foam: '#E8F6FF',
} as const;

export type Theme = {
  dark: boolean;
  bg: string;
  ink: string;
  /** Secondary text, never below 82 % navy in light mode. */
  ink2: string;
  ink3: string;
  line: string;
  /** Glass card fill, drawn over a blur. */
  surface: string;
  surfaceEdge: string;
  surfaceSolid: string;
  fill: string;
  fillStrong: string;
  mintSoft: string;
  blueSoft: string;
  /** Large primary button: blue behind large bold text only (3.8:1). */
  ctaBg: string;
  ctaFg: string;
  pillBg: string;
  pillFg: string;
  upBg: string;
  upFg: string;
  data: string;
  dataNow: string;
  ok: string;
  danger: string;
  warn: string;
  scrim: string;
  blobMint: number;
  blobBlue: number;
  shadow: string;
  blurTint: 'light' | 'dark';
};

export const light: Theme = {
  dark: false,
  bg: palette.foam,
  ink: palette.navy,
  ink2: 'rgba(11, 61, 145, 0.9)',
  ink3: 'rgba(11, 61, 145, 0.82)',
  line: 'rgba(11, 61, 145, 0.14)',
  surface: 'rgba(214, 246, 240, 0.62)',
  surfaceEdge: 'rgba(232, 246, 255, 0.7)',
  surfaceSolid: '#D3ECFD',
  fill: 'rgba(59, 167, 242, 0.16)',
  fillStrong: 'rgba(232, 246, 255, 0.82)',
  mintSoft: 'rgba(127, 231, 214, 0.55)',
  blueSoft: '#A4D6F9',
  ctaBg: palette.blue,
  ctaFg: palette.navy,
  pillBg: palette.navy,
  pillFg: palette.foam,
  upBg: palette.navy,
  upFg: palette.mint,
  data: palette.navy,
  dataNow: palette.blue,
  ok: '#0B6B57',
  danger: '#B4232B',
  warn: '#9A4A06',
  scrim: 'rgba(11, 61, 145, 0.3)',
  blobMint: 1,
  blobBlue: 0.82,
  shadow: '0 14px 34px -18px rgba(11, 61, 145, 0.42)',
  blurTint: 'light',
};

export const dark: Theme = {
  dark: true,
  bg: '#061B40',
  ink: palette.foam,
  ink2: 'rgba(232, 246, 255, 0.86)',
  ink3: 'rgba(232, 246, 255, 0.72)',
  line: 'rgba(232, 246, 255, 0.14)',
  surface: 'rgba(160, 236, 226, 0.1)',
  surfaceEdge: 'rgba(232, 246, 255, 0.16)',
  surfaceSolid: '#0A2754',
  fill: 'rgba(232, 246, 255, 0.09)',
  fillStrong: 'rgba(232, 246, 255, 0.16)',
  mintSoft: 'rgba(127, 231, 214, 0.24)',
  blueSoft: 'rgba(59, 167, 242, 0.26)',
  ctaBg: palette.mint,
  ctaFg: palette.navy,
  pillBg: palette.mint,
  pillFg: palette.navy,
  upBg: palette.mint,
  upFg: palette.navy,
  data: palette.blue,
  dataNow: palette.mint,
  ok: palette.mint,
  danger: '#FF8A8F',
  warn: '#FFB86B',
  scrim: 'rgba(2, 10, 25, 0.62)',
  blobMint: 0.32,
  blobBlue: 0.5,
  shadow: '0 14px 34px -18px rgba(0, 0, 0, 0.65)',
  blurTint: 'dark',
};

/** Manrope weights, loaded in the root layout. */
export const font = {
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
} as const;

export const radius = { card: 22, button: 16, field: 12, pill: 999 } as const;

/** Motion durations in ms: press, state change, screen change. */
export const motion = { press: 120, state: 240, screen: 380 } as const;
