import { router } from 'expo-router';
import { View } from 'react-native';

import { Empty, GoalTag, SectionTitle, Tag, Tile } from '@/components/bits';
import { Button, Press } from '@/components/button';
import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { ScreenScroll, TabHeader } from '@/components/screen';
import { SessionCard } from '@/components/session-card';
import { T } from '@/components/text';
import { dayIndex, lastDate, nextDay, recFor, sessionsByDate, weeklyStats, weekStreak } from '@/core/engine';
import { big, fmtClock, fmtDateLong, fmtRel, plural } from '@/core/format';
import { sampleProgram } from '@/core/sample';
import { useNow } from '@/hooks/use-now';
import { useStartWorkout } from '@/hooks/use-start-workout';
import { update, useData } from '@/store/store';
import { useTheme } from '@/theme/use-theme';

export default function HomeScreen() {
  const t = useTheme();
  const d = useData();
  const start = useStartWorkout();
  const now = useNow(true, d.active ? 1000 : 60_000);
  const next = nextDay(d);
  const week = weeklyStats(d, 1)[0];
  const last = sessionsByDate(d).at(-1);

  return (
    <ScreenScroll>
      <TabHeader kicker={fmtDateLong(now)} title="Accueil" />

      {d.active && (
        <Press onPress={() => router.push('/workout')} accessibilityRole="button" accessibilityLabel={`Reprendre la séance ${d.active.dayName}`}>
          <Glass tint={t.mintSoft} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.ok }} />
            <View style={{ flex: 1 }}>
              <T variant="label">Séance en cours : {d.active.dayName}</T>
              <T variant="small" tone="ink2" style={{ fontVariant: ['tabular-nums'] }}>
                {fmtClock(now - d.active.startedAt)}
              </T>
            </View>
            <Icon name="chevron" size={16} color={t.ink} />
          </Glass>
        </Press>
      )}

      {!next ? (
        <Empty icon="barbell" title="Aucune routine" text="Crée tes jours d’entraînement : l’app calcule ensuite tes objectifs à chaque séance.">
          <Button kind="main" label="Charger un programme exemple" onPress={() => update((x) => x.days.push(...sampleProgram()))} />
        </Empty>
      ) : (
        <Glass style={{ padding: 18, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <T variant="caption" tone="ink2">
                PROCHAINE SÉANCE
              </T>
              <T variant="h2">{next.name}</T>
              <T variant="small" tone="ink2">
                {plural(next.exercises.length, 'exercice')}
                {lastDate(d, next.id) != null ? ` · ${fmtRel(lastDate(d, next.id)!)}` : ''}
              </T>
            </View>
            <Tag label={`Jour ${dayIndex(d, next.id) + 1}`} />
          </View>
          <View style={{ gap: 2 }}>
            {next.exercises.map((ex) => (
              <View key={ex.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36, borderTopWidth: 1, borderTopColor: t.line, paddingTop: 6 }}>
                <T variant="label" style={{ flex: 1 }} numberOfLines={1}>
                  {ex.name}
                </T>
                <GoalTag rec={recFor(d, ex)} />
              </View>
            ))}
          </View>
          <Button
            kind="main"
            icon="play"
            label={d.active?.dayId === next.id ? 'Reprendre' : 'Commencer'}
            disabled={!next.exercises.length}
            onPress={() => start(next.id)}
          />
        </Glass>
      )}

      <SectionTitle title="Cette semaine" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Tile value={String(week.sessions)} label="Séances" />
        <Tile value={`${big(week.volume / 1000)} t`} label="Volume" tone="mint" />
        <Tile value={String(weekStreak(d))} label="Sem. d’affilée" tone="blue" />
      </View>

      {last && (
        <>
          <SectionTitle title="Dernière séance" action="Tout voir" onAction={() => router.push('/history')} />
          <SessionCard session={last} />
        </>
      )}
    </ScreenScroll>
  );
}
