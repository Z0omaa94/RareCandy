import { router } from 'expo-router';
import { View } from 'react-native';

import { Empty, Tag } from '@/components/bits';
import { Button, IconButton } from '@/components/button';
import { useDialog } from '@/components/dialog';
import { Glass } from '@/components/glass';
import { ScreenScroll, TabHeader } from '@/components/screen';
import { T } from '@/components/text';
import { lastDate, nextDay, type TrainingDay } from '@/core/engine';
import { fmtRel } from '@/core/format';
import { useStartWorkout } from '@/hooks/use-start-workout';
import { update, useData } from '@/store/store';

export default function TrainScreen() {
  const d = useData();
  const dialog = useDialog();
  const start = useStartWorkout();
  const nd = nextDay(d);

  const menu = (day: TrainingDay, i: number) => {
    const move = (to: number) =>
      update((x) => {
        const [moved] = x.days.splice(i, 1);
        x.days.splice(to, 0, moved);
      });
    dialog({
      title: day.name,
      message: `Jour ${i + 1} de ta rotation.`,
      buttons: [
        { label: 'Modifier', role: 'primary', run: () => router.push(`/routine/${day.id}`) },
        ...(i > 0 ? [{ label: 'Monter d’un cran', run: () => move(i - 1) }] : []),
        ...(i < d.days.length - 1 ? [{ label: 'Descendre d’un cran', run: () => move(i + 1) }] : []),
      ],
    });
  };

  return (
    <ScreenScroll>
      <TabHeader
        kicker="Tes jours, dans l’ordre"
        title="Entraînement"
        trailing={<IconButton icon="plus" label="Nouvelle routine" filled onPress={() => router.push('/routine/new')} />}
      />

      {!d.days.length && (
        <Empty icon="list" title="Aucune routine" text="Une routine par jour d’entraînement (ex. « Pecs »), avec ses exercices.">
          <Button kind="main" icon="plus" label="Nouvelle routine" onPress={() => router.push('/routine/new')} />
        </Empty>
      )}

      {d.days.map((day, i) => {
        const ld = lastDate(d, day.id);
        const isNext = nd?.id === day.id && day.exercises.length > 0;
        return (
          <Glass key={day.id} style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <T variant="small" tone="ink2">
                  Jour {i + 1}
                  {ld != null ? ` · ${fmtRel(ld)}` : ''}
                </T>
                <T variant="h3">{day.name}</T>
              </View>
              {isNext && <Tag label="Prochaine" />}
              <IconButton icon="more" label={`Options de la routine ${day.name}`} onPress={() => menu(day, i)} />
            </View>
            <T variant="small" tone="ink2" numberOfLines={2}>
              {day.exercises.map((e) => e.name).join(', ') || 'Aucun exercice pour l’instant.'}
            </T>
            <Button
              kind={isNext ? 'main' : 'soft'}
              icon="play"
              label={`Démarrer ${day.name}`}
              disabled={!day.exercises.length}
              onPress={() => start(day.id)}
            />
          </Glass>
        );
      })}

      {d.days.length > 0 && <Button icon="plus" label="Nouvelle routine" onPress={() => router.push('/routine/new')} />}
    </ScreenScroll>
  );
}
