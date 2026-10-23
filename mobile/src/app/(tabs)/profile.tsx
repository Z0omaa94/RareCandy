import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Segmented, SectionTitle } from '@/components/bits';
import { Button, Press } from '@/components/button';
import { BarChart } from '@/components/charts';
import { useDialog } from '@/components/dialog';
import { Glass } from '@/components/glass';
import { Icon, type IconName } from '@/components/icon';
import { ScreenScroll, TabHeader } from '@/components/screen';
import { SessionCard } from '@/components/session-card';
import { T } from '@/components/text';
import { sessionsByDate, sessionVolume, weeklyStats, type WeekStats } from '@/core/engine';
import { big } from '@/core/format';
import { resetData, setSettings, useData, useSettings, type ThemePreference } from '@/store/store';
import { useTheme } from '@/theme/use-theme';

type Metric = 'volume' | 'reps' | 'sessions';
const METRICS: Record<Metric, { label: string; value: (w: WeekStats) => number; unit: string }> = {
  volume: { label: 'Volume', value: (w) => w.volume, unit: ' kg' },
  reps: { label: 'Réps', value: (w) => w.reps, unit: '' },
  sessions: { label: 'Séances', value: (w) => w.sessions, unit: '' },
};

const LINKS: { icon: IconName; label: string; href: Href }[] = [
  { icon: 'chart', label: 'Exercices', href: '/exercises' },
  { icon: 'history', label: 'Historique', href: '/history' },
  { icon: 'trophy', label: 'Records', href: '/records' },
  { icon: 'calendar', label: 'Calendrier', href: '/calendar' },
];

export default function ProfileScreen() {
  const t = useTheme();
  const d = useData();
  const { theme } = useSettings();
  const dialog = useDialog();
  const [metric, setMetric] = useState<Metric>('volume');
  const m = METRICS[metric];
  const weeks = weeklyStats(d, 10);
  const totalVolume = d.sessions.reduce((a, s) => a + sessionVolume(s), 0);
  const exerciseCount = d.days.reduce((a, day) => a + day.exercises.length, 0);
  const recent = sessionsByDate(d).reverse().slice(0, 3);

  const reset = () =>
    dialog({
      title: 'Données de l’app',
      message: 'Remplace tout ce qui est enregistré sur ce téléphone.',
      buttons: [
        { label: 'Recharger l’exemple (12 semaines)', run: () => resetData('sample') },
        { label: 'Repartir de zéro', role: 'destructive', run: () => resetData('empty') },
      ],
    });

  return (
    <ScreenScroll>
      <TabHeader kicker="Ta progression" title="Profil" />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 4 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: t.pillBg }}>
          <T variant="h3" color={t.pillFg}>
            RC
          </T>
        </View>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Stat label="Séances" value={String(d.sessions.length)} />
          <Stat label="Volume total" value={`${big(totalVolume / 1000)} t`} />
          <Stat label="Exercices" value={String(exerciseCount)} />
        </View>
      </View>

      <Glass style={{ padding: 16, gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <T variant="number">
              {big(m.value(weeks[weeks.length - 1]))}
              {m.unit}
            </T>
            <T variant="small" tone="ink2">
              {m.label} cette semaine
            </T>
          </View>
          <T variant="small" tone="ink2">
            10 dernières semaines
          </T>
        </View>
        <BarChart weeks={weeks} value={m.value} label={m.label} unit={m.unit} />
      </Glass>
      <Segmented
        label="Mesure du graphique"
        value={metric}
        onChange={setMetric}
        options={(Object.keys(METRICS) as Metric[]).map((k) => ({ key: k, label: METRICS[k].label }))}
      />

      <SectionTitle title="Tableau de bord" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {LINKS.map((l) => (
          <Press key={l.label} onPress={() => router.push(l.href)} accessibilityRole="button" style={{ flexBasis: '47%', flexGrow: 1 }}>
            <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, minHeight: 56 }}>
              <Icon name={l.icon} size={20} color={t.ink} />
              <T variant="label">{l.label}</T>
            </Glass>
          </Press>
        ))}
      </View>

      {recent.length > 0 && <SectionTitle title="Séances récentes" />}
      {recent.map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}

      <SectionTitle title="Apparence" />
      <Segmented<ThemePreference>
        label="Thème"
        value={theme}
        onChange={(v) => setSettings({ theme: v })}
        options={[
          { key: 'light', label: 'Clair' },
          { key: 'dark', label: 'Sombre' },
          { key: 'auto', label: 'Auto' },
        ]}
      />
      <Button kind="danger" label="Réinitialiser les données" onPress={reset} style={{ marginTop: 12 }} />
    </ScreenScroll>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <T variant="label" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </T>
      <T variant="caption" tone="ink2">
        {label}
      </T>
    </View>
  );
}
