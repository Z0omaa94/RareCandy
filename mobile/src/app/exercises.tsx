import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Empty, SectionTitle } from '@/components/bits';
import { Press } from '@/components/button';
import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { ScreenScroll } from '@/components/screen';
import { T } from '@/components/text';
import { recFor } from '@/core/engine';
import { goalText, weight } from '@/core/format';
import { useData } from '@/store/store';
import { useTheme } from '@/theme/use-theme';

export default function ExercisesScreen() {
  const t = useTheme();
  const d = useData();
  if (!d.days.some((day) => day.exercises.length)) {
    return (
      <ScreenScroll>
        <Empty icon="chart" title="Aucun exercice" text="Ajoute des exercices à tes routines." />
      </ScreenScroll>
    );
  }
  return (
    <ScreenScroll>
      {d.days.map((day, i) =>
        day.exercises.length ? (
          <View key={day.id} style={{ gap: 8 }}>
            <SectionTitle title={`Jour ${i + 1} · ${day.name}`} />
            {day.exercises.map((ex) => {
              const rec = recFor(d, ex);
              const sub = rec.kind === 'increase' ? `Monte à ${weight(rec.to)}` : rec.kind === 'first' ? 'Première fois' : `Objectif ${goalText(rec)}`;
              return (
                <Press key={ex.id} onPress={() => router.push(`/exercise/${ex.id}`)} accessibilityRole="button">
                  <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
                    <Badge icon="barbell" />
                    <View style={{ flex: 1 }}>
                      <T variant="label">{ex.name}</T>
                      <T variant="small" tone="ink2" numberOfLines={1}>
                        {sub}
                      </T>
                    </View>
                    <Icon name="chevron" size={16} color={t.ink2} />
                  </Glass>
                </Press>
              );
            })}
          </View>
        ) : null,
      )}
    </ScreenScroll>
  );
}
