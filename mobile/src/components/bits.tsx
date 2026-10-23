// Small shared pieces: chips, tags, stat tiles, section titles, segmented control, empty states.
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { Recommendation } from '@/core/engine';
import { goalText, weight } from '@/core/format';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Press } from './button';
import { Glass } from './glass';
import { Icon, type IconName } from './icon';
import { T } from './text';

export function Chip({ icon, label, onPress, tone = 'plain' }: { icon?: IconName; label: string; onPress?: () => void; tone?: 'plain' | 'up' | 'goal' }) {
  const t = useTheme();
  const bg = tone === 'up' ? t.upBg : tone === 'goal' ? t.mintSoft : t.fill;
  const fg = tone === 'up' ? t.upFg : t.ink;
  const body = (
    <>
      {icon && <Icon name={icon} size={14} color={fg} />}
      <T variant="small" color={fg} numberOfLines={1} style={{ flexShrink: 1 }}>
        {label}
      </T>
    </>
  );
  const style: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: onPress ? 44 : 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: bg,
    maxWidth: '100%',
  };
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Press onPress={onPress} accessibilityRole="button" style={style}>
      {body}
    </Press>
  );
}

export function Tag({ label, icon, tone = 'plain' }: { label: string; icon?: IconName; tone?: 'plain' | 'up' | 'record' }) {
  const t = useTheme();
  const bg = tone === 'up' ? t.upBg : tone === 'record' ? t.mintSoft : t.fill;
  const fg = tone === 'up' ? t.upFg : t.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: bg }}>
      {icon && <Icon name={icon} size={13} color={fg} />}
      <T variant="caption" color={fg}>
        {label}
      </T>
    </View>
  );
}

/** "Monte à 62,5 kg" / "Première fois" / "3 × 11 · 60 kg". */
export function GoalTag({ rec }: { rec: Recommendation }) {
  if (rec.kind === 'increase') return <Tag tone="up" icon="arrowUp" label={weight(rec.to)} />;
  if (rec.kind === 'first') return <Tag label="Première fois" />;
  return <Tag icon="arrowUR" label={goalText(rec)} />;
}

export function Tile({ value, label, tone = 'plain', style }: { value: string; label: string; tone?: 'plain' | 'mint' | 'blue'; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const tint = tone === 'mint' ? t.mintSoft : tone === 'blue' ? t.blueSoft : undefined;
  return (
    <Glass tint={tint} style={[{ flex: 1, minWidth: 0, paddingVertical: 14, paddingHorizontal: 14, gap: 2 }, style]}>
      <T variant={value.length > 7 ? 'h3' : 'number'} numberOfLines={1} adjustsFontSizeToFit selectable style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </T>
      <T variant="small" tone="ink2" numberOfLines={2}>
        {label}
      </T>
    </Glass>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, minHeight: 44 }}>
      <T variant="h3" accessibilityRole="header">
        {title}
      </T>
      {action && (
        <Press onPress={onAction} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, paddingLeft: 12 }}>
          <T variant="label" tone="ink2">
            {action}
          </T>
          <Icon name="chevron" size={14} color={t.ink2} />
        </Press>
      )}
    </View>
  );
}

export function Segmented<K extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  label: string;
}) {
  const t = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: t.fill, gap: 4 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Press
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            style={{ flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.pillBg : 'transparent' }}>
            <T variant="label" color={on ? t.pillFg : t.ink}>
              {o.label}
            </T>
          </Press>
        );
      })}
    </View>
  );
}

export function Empty({ icon, title, text, children }: { icon: IconName; title: string; text: string; children?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 10 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: t.mintSoft }}>
        <Icon name={icon} size={28} color={t.ink} />
      </View>
      <T variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </T>
      <T variant="body" tone="ink2" style={{ textAlign: 'center' }}>
        {text}
      </T>
      {children && <View style={{ alignSelf: 'stretch', paddingTop: 8 }}>{children}</View>}
    </View>
  );
}

/** Round badge with an icon, used at the start of rows. */
export function Badge({ icon, size = 40 }: { icon: IconName; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: t.mintSoft }}>
      <Icon name={icon} size={size * 0.48} color={t.ink} />
    </View>
  );
}
