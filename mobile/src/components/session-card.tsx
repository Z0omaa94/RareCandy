import { router } from 'expo-router';
import { View } from 'react-native';

import { sessionSets, sessionVolume, type Session } from '@/core/engine';
import { big, fmtDateLong, fmtDuration, plural } from '@/core/format';

import { Press } from './button';
import { Glass } from './glass';
import { T } from './text';

/** Feed card for a finished session (Hevy style): stats, then the first exercises. */
export function SessionCard({ session }: { session: Session }) {
  const shown = session.exercises.slice(0, 4);
  const more = session.exercises.length - shown.length;
  return (
    <Press onPress={() => router.push(`/session/${session.id}`)} accessibilityRole="button" accessibilityLabel={`Séance ${session.dayName}, ${fmtDateLong(session.date)}`}>
      <Glass style={{ padding: 16, gap: 12 }}>
        <View>
          <T variant="h3">{session.dayName}</T>
          <T variant="small" tone="ink2">
            {fmtDateLong(session.date)}
          </T>
        </View>
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <Stat label="Durée" value={fmtDuration(session.duration || 0)} />
          <Stat label="Volume" value={`${big(sessionVolume(session))} kg`} />
          <Stat label="Séries" value={String(sessionSets(session))} />
        </View>
        <View style={{ gap: 4 }}>
          {shown.map((l) => (
            <T key={l.id} variant="small" tone="ink2" numberOfLines={1}>
              <T variant="small">{plural(l.sets.length, 'série')}</T> {l.exerciseName}
            </T>
          ))}
          {more > 0 && (
            <T variant="small" tone="ink2">
              et {plural(more, 'autre exercice')}
            </T>
          )}
        </View>
      </Glass>
    </Press>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <T variant="caption" tone="ink2">
        {label}
      </T>
      <T variant="label" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </T>
    </View>
  );
}
