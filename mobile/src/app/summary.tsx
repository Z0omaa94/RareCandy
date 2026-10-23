import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/backdrop';
import { Empty, SectionTitle, Tag, Tile } from '@/components/bits';
import { Button } from '@/components/button';
import { Glass } from '@/components/glass';
import { Icon, type IconName } from '@/components/icon';
import { T } from '@/components/text';
import type { Outcome } from '@/core/engine';
import { big, fmtSets, goalText, weight } from '@/core/format';
import { setSummary, useSummary } from '@/store/store';
import { useTheme } from '@/theme/use-theme';

const OUTCOME: Record<Outcome, { icon: IconName; label: string }> = {
  met: { icon: 'check', label: 'Objectif atteint' },
  exceeded: { icon: 'arrowUp', label: 'Objectif dépassé' },
  missed: { icon: 'x', label: 'Objectif pas atteint' },
  none: { icon: 'target', label: 'Première séance enregistrée' },
};

export default function SummaryScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const s = useSummary();
  const close = () => {
    setSummary(null);
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!s) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + 40 }}>
        <Backdrop />
        <Empty icon="checkCircle" title="Séance enregistrée" text="Retrouve-la dans ton historique.">
          <Button kind="main" label="Fermer" onPress={close} />
        </Empty>
      </View>
    );
  }

  const met = s.exercises.filter((e) => e.outcome === 'met' || e.outcome === 'exceeded').length;
  const allMet = met === s.exercises.length;

  return (
    <View style={{ flex: 1 }}>
      <Backdrop />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 16, paddingBottom: insets.bottom + 110, gap: 12 }}>
        <Animated.View entering={FadeInDown.duration(380)} style={{ gap: 6, paddingVertical: 8 }}>
          <T variant="title" accessibilityRole="header">
            {allMet ? 'Bien joué !' : 'Séance terminée'}
          </T>
          <T variant="body" tone="ink2">
            C’est ta {s.count}
            {s.count === 1 ? 're' : 'e'} séance. {met}/{s.exercises.length} objectifs atteints.
          </T>
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile value={`${Math.round(s.session.duration / 60_000)} min`} label="Durée" />
          <Tile value={`${big(s.volume)} kg`} label="Volume" tone="mint" />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Tile value={String(s.sets)} label="Séries" tone="blue" />
          <Tile value={String(s.records)} label="Exercices avec record" />
        </View>

        <SectionTitle title="Exercices" />
        <Glass style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
          {s.exercises.map((e, i) => {
            const o = OUTCOME[e.outcome];
            const good = e.outcome === 'met' || e.outcome === 'exceeded';
            return (
              <Animated.View
                key={e.exerciseId}
                entering={FadeInDown.delay(120 + i * 60).duration(240)}
                style={{ flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: good ? t.pillBg : t.fill,
                  }}>
                  <Icon name={o.icon} size={16} color={good ? t.pillFg : e.outcome === 'missed' ? t.danger : t.ink} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <T variant="label">{e.name}</T>
                  <T variant="small" tone="ink2">
                    {o.label} · {fmtSets(e.performed)}
                  </T>
                  {e.next && (
                    <T variant="small" tone="ink2">
                      Prochaine séance : {goalText(e.next)}
                    </T>
                  )}
                  {(e.records.length > 0 || e.next?.kind === 'increase') && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
                      {e.records.map((r) => (
                        <Tag key={r} tone="record" icon="trophy" label={`Record ${r}`} />
                      ))}
                      {e.next?.kind === 'increase' && <Tag tone="up" icon="arrowUp" label={`Prochaine fois : ${weight(e.next.to)}`} />}
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </Glass>
      </ScrollView>
      <View style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
        <Button kind="main" label="Fermer" onPress={close} />
      </View>
    </View>
  );
}
