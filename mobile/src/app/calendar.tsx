import { useState } from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/button';
import { Glass } from '@/components/glass';
import { ScreenScroll } from '@/components/screen';
import { T } from '@/components/text';
import { fmtMonth, plural } from '@/core/format';
import { useData } from '@/store/store';
import { useTheme } from '@/theme/use-theme';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CalendarScreen() {
  const t = useTheme();
  const d = useData();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const { y, m } = month;
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const daysIn = new Date(y, m + 1, 0).getDate();
  const trained = new Set(
    d.sessions
      .map((s) => new Date(s.date))
      .filter((x) => x.getFullYear() === y && x.getMonth() === m)
      .map((x) => x.getDate()),
  );
  const today = new Date();
  const move = (delta: number) => setMonth(({ y: yy, m: mm }) => ({ y: yy + Math.floor((mm + delta) / 12), m: (((mm + delta) % 12) + 12) % 12 }));
  const cells: (number | null)[] = [...Array<null>(offset).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];

  return (
    <ScreenScroll>
      <Glass style={{ padding: 12, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="back" label="Mois précédent" onPress={() => move(-1)} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <T variant="label">{fmtMonth(y, m)}</T>
            <T variant="small" tone="ink2">
              {plural(trained.size, 'jour')} d’entraînement
            </T>
          </View>
          <IconButton icon="chevron" label="Mois suivant" onPress={() => move(1)} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {WEEKDAYS.map((w, i) => (
            <View key={`w${i}`} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 }}>
              <T variant="caption" tone="ink2">
                {w}
              </T>
            </View>
          ))}
          {cells.map((day, i) => {
            const on = day != null && trained.has(day);
            const isToday = day != null && today.getFullYear() === y && today.getMonth() === m && today.getDate() === day;
            return (
              <View key={i} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
                {day != null && (
                  <View
                    accessibilityLabel={`${day}${on ? ', entraînement' : ''}`}
                    style={{
                      flex: 1,
                      borderRadius: 999,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: on ? t.pillBg : 'transparent',
                      borderWidth: isToday ? 2 : 0,
                      borderColor: t.dataNow,
                    }}>
                    <T variant="label" color={on ? t.pillFg : t.ink} style={{ fontVariant: ['tabular-nums'] }}>
                      {day}
                    </T>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Glass>
    </ScreenScroll>
  );
}
