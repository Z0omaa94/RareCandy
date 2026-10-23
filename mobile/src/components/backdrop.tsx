import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { palette } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Fixed background: the theme colour with soft mint and blue light (no motion). */
export function Backdrop() {
  const t = useTheme();
  // Unique gradient ids: on web every SVG shares one document.
  const id = useId().replace(/\W/g, '');
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: t.bg }]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id={`mint${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={palette.mint} stopOpacity={0.85 * t.blobMint} />
            <Stop offset="1" stopColor={palette.mint} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id={`blue${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={palette.blue} stopOpacity={0.6 * t.blobBlue} />
            <Stop offset="1" stopColor={palette.blue} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx="40" cy="120" r="260" fill={`url(#mint${id})`} />
        <Circle cx="390" cy="360" r="240" fill={`url(#blue${id})`} />
        <Circle cx="60" cy="700" r="250" fill={`url(#mint${id})`} />
        <Circle cx="380" cy="860" r="220" fill={`url(#blue${id})`} />
      </Svg>
    </View>
  );
}
