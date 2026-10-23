import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { RestTimer as Rest } from '@/core/engine';
import { fmtClock } from '@/core/format';
import { useNow } from '@/hooks/use-now';
import { success } from '@/utils/haptics';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

import { Press } from '../button';
import { Glass } from '../glass';
import { Icon } from '../icon';
import { T } from '../text';

/** Rest pill shown after a set is validated: ring, countdown, -15 / +15 / Passer. */
export function RestTimer({ rest, onAdd, onSkip }: { rest: Rest; onAdd: (sec: number) => void; onSkip: () => void }) {
  const t = useTheme();
  const now = useNow(true, 250);
  const left = rest.endsAt - now;
  const done = left <= 0;
  const notified = useRef(false);

  useEffect(() => {
    if (done && !notified.current) {
      notified.current = true;
      success();
    }
    if (!done) notified.current = false;
  }, [done]);

  const R = 18;
  const C = 2 * Math.PI * R;
  const frac = done ? 0 : Math.max(0, Math.min(1, left / (rest.total * 1000)));

  return (
    <Glass solid style={{ borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 8 }}>
      <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={44} height={44} viewBox="0 0 44 44" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={22} cy={22} r={R} stroke={t.line} strokeWidth={4} fill="none" />
          <Circle cx={22} cy={22} r={R} stroke={t.dataNow} strokeWidth={4} fill="none" strokeLinecap="round" strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - frac)} />
        </Svg>
        <Icon name={done ? 'check' : 'timer'} size={16} color={t.ink} />
      </View>
      <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
        <T variant="caption" tone="ink2" numberOfLines={1}>
          {done ? 'Repos terminé' : `Repos · ${rest.name}`}
        </T>
        <T variant="h3" style={{ fontVariant: ['tabular-nums'] }}>
          {done ? 'À toi !' : fmtClock(left)}
        </T>
      </View>
      {!done && <Mini label="-15" accessibilityLabel="Moins 15 secondes" onPress={() => onAdd(-15)} />}
      {!done && <Mini label="+15" accessibilityLabel="Plus 15 secondes" onPress={() => onAdd(15)} />}
      <Mini label={done ? 'OK' : 'Passer'} primary onPress={onSkip} />
    </Glass>
  );
}

function Mini({ label, onPress, primary, accessibilityLabel }: { label: string; onPress: () => void; primary?: boolean; accessibilityLabel?: string }) {
  const t = useTheme();
  return (
    <Press
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={{ minWidth: 48, height: 44, paddingHorizontal: 12, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? t.pillBg : t.fill }}>
      <T variant="label" color={primary ? t.pillFg : t.ink}>
        {label}
      </T>
    </Press>
  );
}
