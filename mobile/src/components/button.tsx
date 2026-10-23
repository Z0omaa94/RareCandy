import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Icon, type IconName } from './icon';
import { T } from './text';

/** Press feedback: a slight scale (transform and opacity only). */
export function Press({ style, ...props }: PressableProps & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [style, pressed && { transform: [{ scale: 0.97 }], opacity: 0.88 }]}
    />
  );
}

type Kind = 'main' | 'soft' | 'pill' | 'danger';

/**
 * main: the single primary action of a screen (large bold text on blue).
 * pill: small primary action (navy). soft: secondary. danger: destructive text button.
 */
export function Button({
  label,
  icon,
  kind = 'soft',
  onPress,
  disabled,
  style,
  accessibilityLabel,
}: {
  label: string;
  icon?: IconName;
  kind?: Kind;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const t = useTheme();
  const look = {
    main: { bg: t.ctaBg, fg: t.ctaFg, height: 56, variant: 'h3' as const },
    soft: { bg: t.fill, fg: t.ink, height: 48, variant: 'label' as const },
    pill: { bg: t.pillBg, fg: t.pillFg, height: 44, variant: 'label' as const },
    danger: { bg: 'transparent', fg: t.danger, height: 48, variant: 'label' as const },
  }[kind];
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        {
          minHeight: look.height,
          paddingHorizontal: kind === 'pill' ? 18 : 20,
          borderRadius: kind === 'pill' ? radius.pill : radius.button,
          borderCurve: 'continuous',
          backgroundColor: look.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}>
      {icon && <Icon name={icon} size={kind === 'main' ? 20 : 17} color={look.fg} />}
      <T variant={look.variant} color={look.fg} numberOfLines={1}>
        {label}
      </T>
    </Press>
  );
}

/** Round 44 × 44 icon button (menus, steppers, close). */
export function IconButton({
  icon,
  label,
  onPress,
  filled,
  size = 44,
}: {
  icon: IconName;
  label: string;
  onPress?: () => void;
  filled?: boolean;
  size?: number;
}) {
  const t = useTheme();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? t.fill : 'transparent',
      }}>
      <View pointerEvents="none">
        <Icon name={icon} size={20} color={t.ink} />
      </View>
    </Press>
  );
}
