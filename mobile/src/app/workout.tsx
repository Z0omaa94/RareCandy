import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/backdrop';
import { Badge, Chip, Empty } from '@/components/bits';
import { Button, IconButton } from '@/components/button';
import { DialogProvider, useDialog } from '@/components/dialog';
import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { T } from '@/components/text';
import { useToast } from '@/components/toast';
import { RestTimer } from '@/components/workout/rest-timer';
import { COLUMNS, SetRow } from '@/components/workout/set-row';
import { finishWorkout, uid, type ActiveExercise, type ActiveWorkout } from '@/core/engine';
import { adviceText, big, fmtClock, fmtRest, goalText, stallText, weight } from '@/core/format';
import { useNow } from '@/hooks/use-now';
import { getData, setData, setSummary, update, useData } from '@/store/store';
import { useTheme } from '@/theme/use-theme';
import { success, tap } from '@/utils/haptics';

export default function WorkoutRoute() {
  return (
    <DialogProvider>
      <WorkoutScreen />
    </DialogProvider>
  );
}

function totals(w: ActiveWorkout) {
  let done = 0;
  let total = 0;
  let volume = 0;
  for (const ex of w.exercises) {
    for (const s of ex.sets) {
      total++;
      if (s.done) {
        done++;
        volume += s.reps * s.weight;
      }
    }
  }
  return { done, total, volume };
}

function WorkoutScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const d = useData();
  const w = d.active;
  const now = useNow(!!w);
  const toast = useToast(insets.bottom + (w?.rest ? 92 : 16));

  if (!w) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Backdrop />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 8 }}>
          <IconButton icon="x" label="Fermer" onPress={() => router.back()} />
        </View>
        <Empty icon="barbell" title="Aucune séance en cours" text="Lance une routine depuis l’accueil." />
      </View>
    );
  }

  const tot = totals(w);
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const complete = () => {
    const result = finishWorkout(getData());
    if (!result) return;
    success();
    setData(result.data);
    setSummary(result.summary);
    router.replace('/summary');
  };

  const finish = () => {
    if (tot.done === 0) {
      dialog({
        title: 'Aucune série validée',
        message: 'Touche la coche à droite de chaque série réalisée avant de terminer.',
        buttons: [{ label: 'OK', role: 'primary' }],
      });
      return;
    }
    const left = tot.total - tot.done;
    if (left > 0) {
      dialog({
        title: 'Terminer la séance ?',
        message: left > 1 ? `${left} séries non validées ne seront pas enregistrées.` : '1 série non validée ne sera pas enregistrée.',
        buttons: [{ label: 'Terminer', role: 'primary', run: complete }, { label: 'Continuer la séance' }],
      });
      return;
    }
    complete();
  };

  const discard = () =>
    dialog({
      title: 'Abandonner la séance ?',
      message: 'Les séries saisies ne seront pas enregistrées.',
      buttons: [
        { label: 'Continuer la séance', role: 'primary' },
        {
          label: 'Abandonner',
          role: 'destructive',
          run: () => {
            update((x) => {
              x.active = null;
            });
            close();
          },
        },
      ],
    });

  const editSet = (ei: number, si: number, field: 'weight' | 'reps', value: number) =>
    update((x) => {
      x.active!.exercises[ei].sets[si][field] = value;
    });

  const toggleSet = (ei: number, si: number) => {
    const ex = w.exercises[ei];
    const willBeDone = !ex.sets[si].done;
    update((x) => {
      const a = x.active!;
      a.exercises[ei].sets[si].done = willBeDone;
      if (willBeDone && ex.restSec) a.rest = { endsAt: Date.now() + ex.restSec * 1000, total: ex.restSec, name: ex.name };
    });
    if (willBeDone) success();
    else tap();
  };

  const addSet = (ei: number) =>
    update((x) => {
      const ex = x.active!.exercises[ei];
      const last = ex.sets[ex.sets.length - 1];
      ex.sets.push({ id: uid(), reps: last ? last.reps : ex.rec.repRange.lower, weight: last ? last.weight : 0, target: null, previous: null, done: false });
    });

  const exerciseMenu = (ei: number) => {
    const ex = w.exercises[ei];
    if (ex.sets.length <= 1) {
      dialog({ title: ex.name, message: 'Il reste une seule série : il n’y a rien à retirer.', buttons: [{ label: 'OK', role: 'primary' }] });
      return;
    }
    const n = ex.sets.length;
    dialog({
      title: ex.name,
      buttons: [
        {
          label: `Retirer la série ${n}`,
          role: 'destructive',
          run: () => {
            const removed = ex.sets[n - 1];
            update((x) => {
              x.active!.exercises[ei].sets.pop();
            });
            toast.show(`Série ${n} retirée`, () =>
              update((x) => {
                x.active?.exercises[ei]?.sets.push(removed);
              }),
            );
          },
        },
      ],
    });
  };

  const addRest = (sec: number) =>
    update((x) => {
      const r = x.active?.rest;
      if (!r) return;
      r.endsAt = Math.max(Date.now() + 1000, r.endsAt + sec * 1000);
      r.total = Math.max(r.total, Math.ceil((r.endsAt - Date.now()) / 1000));
    });
  const skipRest = () =>
    update((x) => {
      if (x.active) x.active.rest = null;
    });

  return (
    <View style={{ flex: 1 }}>
      <Backdrop />
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <IconButton icon="down" label="Réduire" filled onPress={close} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T variant="label" numberOfLines={1}>
            {w.dayName}
          </T>
          <T variant="small" tone="ink2" style={{ fontVariant: ['tabular-nums'] }}>
            {fmtClock(now - w.startedAt)}
          </T>
        </View>
        <Button kind="pill" label="Terminer" onPress={finish} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + (w.rest ? 120 : 40), gap: 12 }}>
        <Glass style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Stat label="Durée" value={fmtClock(now - w.startedAt)} />
            <Stat label="Volume" value={`${big(tot.volume)} kg`} />
            <Stat label="Séries" value={`${tot.done} / ${tot.total}`} />
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.fill, overflow: 'hidden' }}>
            <View style={{ height: 6, borderRadius: 3, width: `${tot.total ? (tot.done / tot.total) * 100 : 0}%`, backgroundColor: t.dataNow }} />
          </View>
        </Glass>

        {w.exercises.map((ex, ei) => (
          <ExerciseBlock
            key={ex.exerciseId + ei}
            ex={ex}
            onMenu={() => exerciseMenu(ei)}
            onEdit={(si, field, value) => editSet(ei, si, field, value)}
            onToggle={(si) => toggleSet(ei, si)}
            onAddSet={() => addSet(ei)}
          />
        ))}

        <Button kind="danger" label="Abandonner la séance" onPress={discard} />
      </ScrollView>

      {w.rest && (
        <View style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 12 }}>
          <RestTimer rest={w.rest} onAdd={addRest} onSkip={skipRest} />
        </View>
      )}
      {toast.node}
    </View>
  );
}

function ExerciseBlock({
  ex,
  onMenu,
  onEdit,
  onToggle,
  onAddSet,
}: {
  ex: ActiveExercise;
  onMenu: () => void;
  onEdit: (si: number, field: 'weight' | 'reps', value: number) => void;
  onToggle: (si: number) => void;
  onAddSet: () => void;
}) {
  const t = useTheme();
  const rec = ex.rec;
  const stall = stallText(rec);
  const done = ex.sets.filter((s) => s.done).length;
  return (
    <Glass style={{ padding: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Badge icon="barbell" size={44} />
        <View style={{ flex: 1 }}>
          <T variant="h3" numberOfLines={2}>
            {ex.name}
          </T>
          <T variant="small" tone="ink2">
            {ex.muscle ? `${ex.muscle} · ` : ''}
            {done}/{ex.sets.length} séries
          </T>
        </View>
        <IconButton icon="more" label={`Options : ${ex.name}`} onPress={onMenu} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {rec.kind === 'increase' ? (
          <Chip tone="up" icon="arrowUp" label={`Monte à ${weight(rec.to)}`} />
        ) : rec.kind === 'first' ? (
          <Chip icon="target" label="Première fois" />
        ) : (
          <Chip tone="goal" icon="target" label={goalText(rec)} />
        )}
        <Chip icon="timer" label={`Repos : ${fmtRest(ex.restSec)}`} />
      </View>

      <T variant="small" tone="ink2">
        {adviceText(rec)}
      </T>
      {stall && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="warning" size={16} color={t.warn} />
          <T variant="small" color={t.warn} style={{ flex: 1 }}>
            {stall}
          </T>
        </View>
      )}

      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
          <Head label="SÉRIE" width={COLUMNS.set} center />
          <Head label="PRÉCÉDENT" flex />
          <Head label="KG" width={COLUMNS.input} center />
          <Head label="RÉPS" width={COLUMNS.input} center />
          <View style={{ width: COLUMNS.check, alignItems: 'center' }}>
            <Icon name="check" size={14} color={t.ink2} />
          </View>
        </View>
        {ex.sets.map((s, si) => (
          <SetRow key={s.id} set={s} index={si} onChange={(field, value) => onEdit(si, field, value)} onToggle={() => onToggle(si)} />
        ))}
      </View>
      <Button icon="plus" label="Ajouter une série" onPress={onAddSet} />
    </Glass>
  );
}

function Head({ label, width, flex, center }: { label: string; width?: number; flex?: boolean; center?: boolean }) {
  return (
    <T variant="caption" tone="ink2" numberOfLines={1} style={{ width, flex: flex ? 1 : undefined, textAlign: center ? 'center' : 'left' }}>
      {label}
    </T>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'flex-start' }}>
      <T variant="caption" tone="ink2">
        {label}
      </T>
      <T variant="label" style={{ fontVariant: ['tabular-nums'] }}>
        {value}
      </T>
    </View>
  );
}
