import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '@/components/backdrop';
import { Badge, Chip } from '@/components/bits';
import { Button, IconButton, Press } from '@/components/button';
import { DialogProvider, useDialog } from '@/components/dialog';
import { Glass } from '@/components/glass';
import { Icon } from '@/components/icon';
import { T } from '@/components/text';
import { findDay, round2, uid, type Exercise, type TrainingDay } from '@/core/engine';
import { fmtRest, num } from '@/core/format';
import { LIBRARY, newExercise } from '@/core/sample';
import { getData, update } from '@/store/store';
import { font, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';
import { tap } from '@/utils/haptics';

export default function RoutineRoute() {
  return (
    <DialogProvider>
      <RoutineEditor />
    </DialogProvider>
  );
}

type Field = 'sets' | 'inc' | 'lower' | 'upper';

function RoutineEditor() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [original] = useState<TrainingDay>(() => {
    const day = id && id !== 'new' ? findDay(getData(), id) : null;
    return day ? JSON.parse(JSON.stringify(day)) : { id: uid(), name: '', exercises: [] };
  });
  const isNew = !findDay(getData(), original.id);
  const [draft, setDraft] = useState<TrainingDay>(original);
  const [library, setLibrary] = useState(false);

  const changed = JSON.stringify(draft) !== JSON.stringify(original);
  const editExercise = (i: number, change: (ex: Exercise) => Exercise) =>
    setDraft((r) => ({ ...r, exercises: r.exercises.map((ex, k) => (k === i ? change(ex) : ex)) }));

  const close = () => (router.canGoBack() ? router.back() : router.replace('/train'));
  const cancel = () => {
    if (!changed) return close();
    dialog({
      title: 'Abandonner les modifications ?',
      message: 'Ce que tu as changé dans cette routine sera perdu.',
      buttons: [{ label: 'Continuer à modifier', role: 'primary' }, { label: 'Abandonner', role: 'destructive', run: close }],
    });
  };
  const save = () => {
    const r = { ...draft, name: draft.name.trim() };
    if (!r.name) return;
    update((x) => {
      const i = x.days.findIndex((day) => day.id === r.id);
      if (i >= 0) x.days[i] = r;
      else x.days.push(r);
    });
    close();
  };
  const remove = () =>
    dialog({
      title: `Supprimer « ${original.name} » ?`,
      message: 'L’historique de ses séances est conservé.',
      buttons: [
        {
          label: 'Supprimer',
          role: 'destructive',
          run: () => {
            update((x) => {
              x.days = x.days.filter((day) => day.id !== original.id);
            });
            close();
          },
        },
      ],
    });

  const step = (i: number, f: Field, delta: number) => {
    tap();
    editExercise(i, (ex) => {
      const r = { ...ex.repRange };
      if (f === 'sets') return { ...ex, targetSets: Math.min(10, Math.max(1, ex.targetSets + delta)) };
      if (f === 'inc') return { ...ex, weightIncrement: Math.min(50, Math.max(0, round2(ex.weightIncrement + delta * 0.5))) };
      if (f === 'lower') {
        r.lower = Math.min(50, Math.max(1, r.lower + delta));
        r.upper = Math.max(r.upper, r.lower);
      } else {
        r.upper = Math.min(50, Math.max(1, r.upper + delta));
        r.lower = Math.min(r.lower, r.upper);
      }
      return { ...ex, repRange: r };
    });
  };

  const exerciseMenu = (i: number) => {
    const ex = draft.exercises[i];
    const move = (to: number) =>
      setDraft((r) => {
        const list = r.exercises.slice();
        const [moved] = list.splice(i, 1);
        list.splice(to, 0, moved);
        return { ...r, exercises: list };
      });
    dialog({
      title: ex.name,
      buttons: [
        {
          label: 'Renommer',
          run: () =>
            dialog({
              title: 'Renommer',
              input: { label: 'Nom de l’exercice', value: ex.name },
              buttons: [
                { label: 'Enregistrer', role: 'primary', run: (v) => v.trim() && editExercise(i, (e) => ({ ...e, name: v.trim() })) },
                { label: 'Annuler' },
              ],
            }),
        },
        ...(i > 0 ? [{ label: 'Monter', run: () => move(i - 1) }] : []),
        ...(i < draft.exercises.length - 1 ? [{ label: 'Descendre', run: () => move(i + 1) }] : []),
        { label: 'Retirer l’exercice', role: 'destructive' as const, run: () => setDraft((r) => ({ ...r, exercises: r.exercises.filter((_, k) => k !== i) })) },
      ],
    });
  };

  const pickRest = (i: number) =>
    dialog({
      title: 'Temps de repos',
      message: 'Le minuteur démarre quand tu valides une série.',
      buttons: [0, 60, 90, 120, 180, 300].map((sec) => ({
        label: fmtRest(sec),
        role: draft.exercises[i].restSec === sec ? ('on' as const) : undefined,
        run: () => editExercise(i, (ex) => ({ ...ex, restSec: sec })),
      })),
    });

  const editNote = (i: number) =>
    dialog({
      title: 'Note',
      message: 'Réglages de la machine, prise, tempo…',
      input: { label: 'Note', value: draft.exercises[i].notes, placeholder: 'Ex. siège cran 4' },
      buttons: [{ label: 'Enregistrer', role: 'primary', run: (v) => editExercise(i, (ex) => ({ ...ex, notes: v.trim() })) }, { label: 'Annuler' }],
    });

  return (
    <View style={{ flex: 1 }}>
      <Backdrop />
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Button kind="soft" label="Annuler" onPress={cancel} style={{ minHeight: 44, borderRadius: radius.pill }} />
        <T variant="label" style={{ flex: 1, textAlign: 'center' }}>
          {isNew ? 'Nouvelle routine' : 'Routine'}
        </T>
        <Button kind="pill" label="Enregistrer" onPress={save} disabled={!draft.name.trim()} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 40, gap: 12 }}>
        <View style={{ gap: 6 }}>
          <T variant="caption" tone="ink2">
            NOM DE LA ROUTINE
          </T>
          <TextInput
            value={draft.name}
            onChangeText={(name) => setDraft((r) => ({ ...r, name }))}
            placeholder="Ex. Pecs"
            placeholderTextColor={t.ink3}
            accessibilityLabel="Nom de la routine"
            autoFocus={isNew}
            returnKeyType="done"
            style={{ fontFamily: font.extrabold, fontSize: 28, color: t.ink, paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: t.line }}
          />
        </View>

        {draft.exercises.map((ex, i) => (
          <Glass key={ex.id} style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Badge icon="barbell" />
              <View style={{ flex: 1 }}>
                <T variant="label">{ex.name}</T>
                <T variant="small" tone="ink2">
                  {ex.muscle}
                </T>
              </View>
              <IconButton icon="more" label={`Options : ${ex.name}`} onPress={() => exerciseMenu(i)} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <Chip icon="timer" label={`Repos : ${fmtRest(ex.restSec)}`} onPress={() => pickRest(i)} />
              <Chip icon="note" label={ex.notes || 'Note'} onPress={() => editNote(i)} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Stepper label="Séries" value={String(ex.targetSets)} onStep={(dl) => step(i, 'sets', dl)} />
              <Stepper label="Charge +" value={`${num(ex.weightIncrement)} kg`} onStep={(dl) => step(i, 'inc', dl)} />
              <Stepper label="Reps min" value={String(ex.repRange.lower)} onStep={(dl) => step(i, 'lower', dl)} />
              <Stepper label="Reps max" value={String(ex.repRange.upper)} onStep={(dl) => step(i, 'upper', dl)} />
            </View>
            <T variant="small" tone="ink2">
              {ex.weightIncrement > 0
                ? `Objectif +1 rep par séance. À ${ex.repRange.upper} reps sur toutes les séries : +${num(ex.weightIncrement)} kg et retour à ${ex.repRange.lower}.`
                : 'Sans charge ajoutée : +1 rep par série à chaque séance, sans plafond.'}
            </T>
          </Glass>
        ))}

        <Button icon="plus" label="Ajouter un exercice" onPress={() => setLibrary(true)} />
        {!isNew && <Button kind="danger" label="Supprimer la routine" onPress={remove} />}
      </ScrollView>

      <LibrarySheet
        visible={library}
        onClose={() => setLibrary(false)}
        onPick={(ex) => {
          setDraft((r) => ({ ...r, exercises: [...r.exercises, ex] }));
          setLibrary(false);
        }}
      />
    </View>
  );
}

function Stepper({ label, value, onStep }: { label: string; value: string; onStep: (delta: number) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', padding: 8, paddingLeft: 12, borderRadius: radius.button, backgroundColor: t.fill }}>
      <View style={{ flex: 1 }}>
        <T variant="caption" tone="ink2">
          {label.toUpperCase()}
        </T>
        <T variant="label" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </T>
      </View>
      <IconButton icon="minus" label={`${label} moins`} onPress={() => onStep(-1)} />
      <IconButton icon="plus" label={`${label} plus`} onPress={() => onStep(1)} />
    </View>
  );
}

/** Native sheet with the exercise library, a search field, and custom exercises. */
function LibrarySheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (ex: Exercise) => void }) {
  const t = useTheme();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const items = LIBRARY.filter((it) => !q || it.name.toLowerCase().includes(q) || it.muscle.toLowerCase().includes(q));
  const canCreate = q.length > 0 && !LIBRARY.some((it) => it.name.toLowerCase() === q);

  const close = () => {
    setQuery('');
    onClose();
  };
  const pick = (ex: Exercise) => {
    setQuery('');
    onPick(ex);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: t.surfaceSolid }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
          <T variant="h3" style={{ flex: 1, paddingLeft: 4 }}>
            Ajouter un exercice
          </T>
          <IconButton icon="x" label="Fermer" filled onPress={close} />
        </View>
        <View style={{ marginHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: radius.field, backgroundColor: t.fill }}>
          <Icon name="search" size={18} color={t.ink2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher ou créer"
            placeholderTextColor={t.ink3}
            accessibilityLabel="Rechercher ou créer un exercice"
            autoCorrect={false}
            style={{ flex: 1, minHeight: 48, color: t.ink, fontFamily: font.semibold, fontSize: 16 }}
          />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 4 }}>
          {canCreate && (
            <Row icon="plus" title={`Créer « ${query.trim()} »`} subtitle="Exercice personnalisé" onPress={() => pick(newExercise(query.trim(), 'Autre', 2.5))} />
          )}
          {items.map((it, i) => {
            const header = i === 0 || items[i - 1].muscle !== it.muscle;
            return (
              <View key={it.name}>
                {header && (
                  <T variant="caption" tone="ink2" style={{ paddingTop: 12, paddingBottom: 4 }}>
                    {it.muscle.toUpperCase()}
                  </T>
                )}
                <Row
                  icon="barbell"
                  title={it.name}
                  subtitle={it.increment > 0 ? `+${num(it.increment)} kg à chaque montée` : 'Poids du corps'}
                  onPress={() => pick(newExercise(it.name, it.muscle, it.increment))}
                />
              </View>
            );
          })}
          {!items.length && !canCreate && (
            <T variant="body" tone="ink2" style={{ padding: 20 }}>
              Aucun exercice trouvé.
            </T>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Row({ icon, title, subtitle, onPress }: { icon: 'plus' | 'barbell'; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Press onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 6 }}>
      <Badge icon={icon} />
      <View style={{ flex: 1 }}>
        <T variant="label">{title}</T>
        <T variant="small" tone="ink2">
          {subtitle}
        </T>
      </View>
    </Press>
  );
}
