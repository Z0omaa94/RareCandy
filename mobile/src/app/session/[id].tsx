import { router, Stack, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Badge, Empty, Tile } from '@/components/bits';
import { Button } from '@/components/button';
import { useDialog } from '@/components/dialog';
import { Glass } from '@/components/glass';
import { ScreenScroll } from '@/components/screen';
import { T } from '@/components/text';
import { sessionSets, sessionVolume } from '@/core/engine';
import { big, fmtDateLong, fmtDuration, num } from '@/core/format';
import { update, useData } from '@/store/store';
import { useTheme } from '@/theme/use-theme';

export default function SessionScreen() {
  const t = useTheme();
  const d = useData();
  const dialog = useDialog();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = d.sessions.find((x) => x.id === id);

  if (!s) {
    return (
      <ScreenScroll>
        <Empty icon="history" title="Séance supprimée" text="Elle n’est plus dans ton historique." />
      </ScreenScroll>
    );
  }

  const remove = () =>
    dialog({
      title: 'Supprimer cette séance ?',
      message: 'Les objectifs suivants seront recalculés sans elle.',
      buttons: [
        {
          label: 'Supprimer',
          role: 'destructive',
          run: () => {
            router.back();
            update((x) => {
              x.sessions = x.sessions.filter((y) => y.id !== s.id);
            });
          },
        },
      ],
    });

  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: s.dayName }} />
      <T variant="small" tone="ink2">
        {fmtDateLong(s.date)}
      </T>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tile value={fmtDuration(s.duration || 0)} label="Durée" />
        <Tile value={big(sessionVolume(s))} label="Volume (kg)" tone="mint" />
        <Tile value={String(sessionSets(s))} label="Séries" tone="blue" />
      </View>
      {s.exercises.map((l) => (
        <Glass key={l.id} style={{ padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Badge icon="barbell" size={36} />
            <T variant="label" style={{ flex: 1 }}>
              {l.exerciseName}
            </T>
          </View>
          <View style={{ flexDirection: 'row', paddingHorizontal: 4 }}>
            {['SÉRIE', 'KG', 'RÉPS'].map((h) => (
              <T key={h} variant="caption" tone="ink2" style={{ flex: 1, textAlign: 'center' }}>
                {h}
              </T>
            ))}
          </View>
          {l.sets.map((st, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 6, borderTopWidth: 1, borderTopColor: t.line }}>
              <T variant="label" style={{ flex: 1, textAlign: 'center' }}>
                {i + 1}
              </T>
              <T variant="label" style={{ flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                {st.weight > 0 ? num(st.weight) : 'PDC'}
              </T>
              <T variant="label" style={{ flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] }}>
                {st.reps}
              </T>
            </View>
          ))}
        </Glass>
      ))}
      <Button kind="danger" label="Supprimer la séance" onPress={remove} />
    </ScreenScroll>
  );
}
