import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

/** Frosted card: blur of the background, tinted with the theme surface, thin light edge. */
export function Glass({
  children,
  style,
  tint,
  solid,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Overrides the surface tint (e.g. mint tile). */
  tint?: string;
  /** Opaque surface for overlays (dialogs, timer) where text sits on busy content. */
  solid?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius.card,
          borderCurve: 'continuous',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: t.surfaceEdge,
        },
        style,
      ]}>
      {!solid && <BlurView intensity={t.dark ? 28 : 36} tint={t.blurTint} style={StyleSheet.absoluteFill} />}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: solid ? t.surfaceSolid : (tint ?? t.surface) }]} />
      {children}
    </View>
  );
}
