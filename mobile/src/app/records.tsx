import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Empty } from '@/components/bits';
import { Press } from '@/components/button';
import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen';
import { T } from '@/components/text';
import { exerciseRecords } from '@/core/engine';
import { big, fmtSet } from '@/core/format';
import { useData } from '@/store/store';
import { useTheme } from '@/theme/use-theme';

export default function RecordsScreen() {
  const t = useTheme();
  const d = useData();
  const rows = d.days
    .flatMap((day) => day.exercises)
    .map((ex) => ({ ex, r: exerciseRecords(d, ex.id) }))
    .filter((o) => o.r)
    .sort((a, b) => (b.r!.e1rm?.value ?? 0) - (a.r!.e1rm?.value ?? 0));

  return (
    <ScreenScroll>
      {!rows.length && <Empty icon="trophy" title="Pas encore de records" text="Termine une séance pour établir tes premiers records." />}
      {rows.map(({ ex, r }) => (
        <Press key={ex.id} onPress={() => router.push(`/exercise/${ex.id}`)} accessibilityRole="button">
          <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
            <Badge icon="trophy" />
            <View style={{ flex: 1 }}>
              <T variant="label">{ex.name}</T>
              <T variant="small" tone="ink2" numberOfLines={1}>
                {r!.e1rm?.value ? `1RM estimé ${big(r!.e1rm.value)} kg · ` : ''}
                Meilleure série {r!.heaviest ? fmtSet(r!.heaviest.set) : '-'}
              </T>
            </View>
            <Icon name="chevron" size={16} color={t.ink2} />
          </Glass>
        </Press>
      ))}
    </ScreenScroll>
  );
}
