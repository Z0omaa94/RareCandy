import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Empty, Segmented, SectionTitle, Tag, Tile } from '@/components/bits';
import { LineChart } from '@/components/charts';
import { Glass } from '@/components/glass';
import { ScreenScroll } from '@/components/screen';
import { T } from '@/components/text';
import { bestE1rm, exerciseRecords, findExercise, historyOf, recFor, topWeight, totalReps, volume, type HistoryEntry } from '@/core/engine';
import { adviceText, big, fmtDate, fmtSet, fmtSets, goalText, stallText } from '@/core/format';
import { useData } from '@/store/store';
import { useTheme } from '@/theme/use-theme';

type Metric = 'e1rm' | 'top' | 'vol' | 'reps';
const METRICS: Record<Metric, { label: string; value: (r: HistoryEntry) => number }> = {
  e1rm: { label: '1RM', value: (r) => bestE1rm(r.log) },
  top: { label: 'Charge', value: (r) => topWeight(r.log) },
  vol: { label: 'Volume', value: (r) => volume(r.log) },
  reps: { label: 'Réps', value: (r) => totalReps(r.log) },
};

export default function ExerciseScreen() {
  const t = useTheme();
  const d = useData();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [metric, setMetric] = useState<Metric>('e1rm');
  const found = findExercise(d, id);

  if (!found) {
    return (
      <ScreenScroll>
        <Empty icon="chart" title="Exercice supprimé" text="Il n’est plus dans tes routines." />
      </ScreenScroll>
    );
  }

  const ex = found.exercise;
  const rec = recFor(d, ex);
  const hist = historyOf(d, ex.id);
  const recs = exerciseRecords(d, ex.id);
  const stall = stallText(rec);
  // Body-weight exercises only make sense in reps.
  const bodyweight = hist.length > 0 && hist.every((r) => topWeight(r.log) === 0);
  const shown: Metric = bodyweight ? 'reps' : metric;
  const keys = (Object.keys(METRICS) as Metric[]).filter((k) => !bodyweight || k === 'reps');

  return (
    <ScreenScroll>
      <Stack.Screen options={{ title: ex.name }} />
      <Glass style={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <T variant="caption" tone="ink2">
              PROCHAINE SÉANCE
            </T>
            <T variant="h2">{goalText(rec)}</T>
          </View>
          {rec.kind === 'increase' ? (
            <Tag tone="up" icon="arrowUp" label="Monte la charge" />
          ) : (
            <Tag icon="target" label={rec.kind === 'first' ? 'Première fois' : '+1 rep'} />
          )}
        </View>
        <T variant="small" tone="ink2">
          {adviceText(rec)}
        </T>
        {stall && (
          <T variant="small" color={t.warn}>
            {stall}
          </T>
        )}
      </Glass>

      {recs && (
        <>
          <SectionTitle title="Records" />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile value={recs.e1rm?.value ? `${big(recs.e1rm.value)} kg` : '-'} label="1RM estimé" tone="mint" />
            <Tile value={recs.heaviest ? fmtSet(recs.heaviest.set) : '-'} label="Meilleure série" tone="blue" />
            <Tile value={recs.volume ? big(recs.volume.value) : '-'} label="Volume max (kg)" />
          </View>
        </>
      )}

      {hist.length >= 2 && (
        <>
          <SectionTitle title="Progression" />
          <Glass style={{ padding: 12 }}>
            <LineChart label={METRICS[shown].label} points={hist.map((r) => ({ x: r.date, y: METRICS[shown].value(r) }))} />
          </Glass>
          {keys.length > 1 && (
            <Segmented label="Mesure du graphique" value={shown} onChange={setMetric} options={keys.map((k) => ({ key: k, label: METRICS[k].label }))} />
          )}
        </>
      )}

      {hist.length > 0 && (
        <>
          <SectionTitle title="Historique" />
          <Glass style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
            {hist
              .slice()
              .reverse()
              .slice(0, 12)
              .map((r, i) => (
                <View
                  key={r.sessionId}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
                  <T variant="label" style={{ flex: 1 }}>
                    {fmtSets(r.log.sets)}
                  </T>
                  <T variant="small" tone="ink2">
                    {fmtDate(r.date)}
                  </T>
                </View>
              ))}
          </Glass>
        </>
      )}
    </ScreenScroll>
  );
}
