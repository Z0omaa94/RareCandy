/// <reference types="node" />
// Run with: npm test (Node's built-in test runner, TypeScript types stripped).
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  e1rm,
  emptyData,
  evaluate,
  finishWorkout,
  nextDay,
  recFor,
  recommend,
  sessionsWithoutProgress,
  startWorkout,
  type Exercise,
  type HistoryEntry,
  type SetLog,
  type TrainingData,
} from './engine.ts';
import { newExercise, sampleData } from './sample.ts';

const bench = (increment = 2.5): Exercise => newExercise('Développé couché', 'Pectoraux', increment);

function history(...sessions: SetLog[][]): HistoryEntry[] {
  return sessions.map((sets, i) => ({
    sessionId: `s${i}`,
    date: i,
    log: { id: `l${i}`, exerciseId: 'x', exerciseName: 'x', sets },
  }));
}
const sets = (reps: number[], weight: number): SetLog[] => reps.map((r) => ({ reps: r, weight }));
const targets = (ex: Exercise, h: HistoryEntry[]) => recommend(ex, h).targets;

describe('recommend', () => {
  test('sans historique : bas de la fourchette, charge à choisir', () => {
    const rec = recommend(bench(), []);
    assert.equal(rec.kind, 'first');
    assert.deepEqual(rec.targets, [
      { reps: 10, weight: null },
      { reps: 10, weight: null },
      { reps: 10, weight: null },
    ]);
  });

  test('3 × 10 la dernière fois → 3 × 11 à la même charge', () => {
    const rec = recommend(bench(), history(sets([10, 10, 10], 60)));
    assert.equal(rec.kind, 'addReps');
    assert.deepEqual(rec.targets, sets([11, 11, 11], 60));
  });

  test('séries inégales : +1 rep sur chaque série', () => {
    assert.deepEqual(targets(bench(), history(sets([12, 11, 9], 60))), sets([13, 12, 10], 60));
  });

  test('une série au max y reste tant que les autres n’y sont pas', () => {
    assert.deepEqual(targets(bench(), history(sets([15, 14, 13], 60))), sets([15, 15, 14], 60));
  });

  test('toutes les séries à 15 → monte la charge et repars à 10', () => {
    const rec = recommend(bench(), history(sets([15, 15, 15], 60)));
    assert.equal(rec.kind, 'increase');
    if (rec.kind !== 'increase') return;
    assert.equal(rec.from, 60);
    assert.equal(rec.to, 62.5);
    assert.deepEqual(rec.targets, sets([10, 10, 10], 62.5));
  });

  test('au-dessus du max compte comme max atteint', () => {
    assert.equal(recommend(bench(), history(sets([16, 15, 17], 60))).kind, 'increase');
  });

  test('séries manquantes : pas de montée, la série manquante reprend la dernière', () => {
    const rec = recommend(bench(), history(sets([15, 15], 60)));
    assert.equal(rec.kind, 'addReps');
    assert.deepEqual(rec.targets, sets([15, 15, 15], 60));
  });

  test('séries en trop : on garde le nombre prévu', () => {
    assert.deepEqual(targets(bench(), history(sets([10, 10, 10, 8], 60))), sets([11, 11, 11], 60));
  });

  test('charges différentes par série : chaque série garde sa charge', () => {
    const last = [
      { reps: 10, weight: 60 },
      { reps: 9, weight: 55 },
    ];
    const ex = { ...bench(), targetSets: 2 };
    assert.deepEqual(targets(ex, history(last)), [
      { reps: 11, weight: 60 },
      { reps: 10, weight: 55 },
    ]);
  });

  test('se base sur la séance la plus récente', () => {
    assert.deepEqual(targets(bench(), history(sets([10, 10, 10], 60), sets([12, 12, 12], 60))), sets([13, 13, 13], 60));
  });

  test('incrément 0 : +1 rep sans plafond', () => {
    assert.deepEqual(targets(bench(0), history(sets([20, 20, 20], 0))), sets([21, 21, 21], 0));
  });

  test('pas d’erreur d’arrondi après plusieurs incréments', () => {
    const ex = { ...bench(0.1), targetSets: 1 };
    let h = history(sets([15], 0.2));
    for (let i = 0; i < 5; i++) {
      const rec = recommend(ex, h);
      h = history(rec.targets.map((t) => ({ reps: 15, weight: t.weight ?? 0 })));
    }
    assert.equal(recommend(ex, h).targets[0].weight, 0.8);
  });

  test('cycle complet : de 3 × 10 à la montée en charge', () => {
    const ex = bench();
    let h = history(sets([10, 10, 10], 60));
    for (let reps = 11; reps <= 15; reps++) {
      const rec = recommend(ex, h);
      assert.deepEqual(rec.targets, sets([reps, reps, reps], 60));
      h = [...h, ...history(rec.targets.map((t) => ({ reps: t.reps, weight: t.weight ?? 0 })))];
    }
    const rec = recommend(ex, h);
    assert.equal(rec.kind, 'increase');
    assert.deepEqual(rec.targets, sets([10, 10, 10], 62.5));
  });
});

describe('evaluate', () => {
  const rec = recommend(bench(), history(sets([10, 10, 10], 60)));
  test('atteint', () => assert.equal(evaluate(sets([11, 11, 11], 60), rec), 'met'));
  test('dépassé', () => assert.equal(evaluate(sets([12, 11, 11], 60), rec), 'exceeded'));
  test('raté', () => {
    assert.equal(evaluate(sets([11, 10, 11], 60), rec), 'missed');
    assert.equal(evaluate(sets([11, 11], 60), rec), 'missed');
  });
  test('première séance : pas d’objectif', () => assert.equal(evaluate(sets([10], 50), recommend(bench(), [])), 'none'));
});

describe('stagnation', () => {
  test('un progrès remet le compteur à zéro', () => {
    assert.equal(sessionsWithoutProgress(history(sets([10, 10, 10], 60), sets([10, 10, 10], 60), sets([11, 10, 10], 60))), 0);
  });
  test('une montée de charge compte comme un progrès', () => {
    assert.equal(sessionsWithoutProgress(history(sets([15, 15, 15], 60), sets([10, 10, 10], 62.5))), 0);
  });
  test('signalée après 3 séances sans progrès', () => {
    const same = sets([10, 10, 10], 60);
    const rec = recommend(bench(), history(sets([9, 9, 9], 60), same, same, same));
    assert.equal(rec.stall, 2);
    assert.equal(recommend(bench(), history(sets([9, 9, 9], 60), same, same, same, same)).stall, 3);
  });
});

test('1RM estimé (Epley)', () => {
  assert.equal(e1rm(100, 1), 100);
  assert.equal(Math.round(e1rm(100, 10) * 10) / 10, 133.3);
  assert.equal(e1rm(0, 10), 0);
});

describe('séances', () => {
  function program(): TrainingData {
    return {
      ...emptyData(),
      days: [
        { id: 'd1', name: 'Pecs', exercises: [{ ...bench(), id: 'bench' }] },
        { id: 'd2', name: 'Dos', exercises: [{ ...newExercise('Rowing barre', 'Dos', 2.5), id: 'row' }] },
        { id: 'd3', name: 'Repos', exercises: [] },
      ],
    };
  }

  test('scénario : pecs 3 × 10, la séance pecs suivante vise 11', () => {
    let d = startWorkout(program(), 'd1', 1000);
    d.active!.exercises[0].sets.forEach((s) => {
      s.weight = 60;
      s.done = true;
    });
    const result = finishWorkout(d, 2000);
    assert.ok(result);
    d = result.data;
    assert.equal(d.active, null);
    assert.equal(result.summary.exercises[0].outcome, 'none');
    assert.deepEqual(recFor(d, d.days[0].exercises[0]).targets, sets([11, 11, 11], 60));
  });

  test('seules les séries validées sont enregistrées', () => {
    const d = startWorkout(program(), 'd1');
    d.active!.exercises[0].sets[0].done = true;
    const result = finishWorkout(d);
    assert.equal(result?.data.sessions[0].exercises[0].sets.length, 1);
  });

  test('aucune série validée : rien n’est enregistré', () => {
    const d = startWorkout(program(), 'd1');
    assert.equal(finishWorkout(d), null);
    assert.ok(d.active);
  });

  test('record détecté quand le 1RM estimé dépasse l’historique', () => {
    let d = startWorkout(program(), 'd1');
    d.active!.exercises[0].sets.forEach((s) => {
      s.weight = 60;
      s.done = true;
    });
    d = finishWorkout(d)!.data;
    d = startWorkout(d, 'd1');
    d.active!.exercises[0].sets.forEach((s) => (s.done = true));
    const summary = finishWorkout(d)!.summary;
    assert.equal(summary.exercises[0].outcome, 'met');
    assert.deepEqual(summary.exercises[0].records, ['1RM estimé', 'volume']);
    assert.equal(summary.records, 1);
  });

  test('rotation : le jour suivant, en sautant les jours vides', () => {
    let d = program();
    assert.equal(nextDay(d)?.id, 'd1');
    d = startWorkout(d, 'd2');
    d.active!.exercises[0].sets[0].done = true;
    d = finishWorkout(d)!.data;
    assert.equal(nextDay(d)?.id, 'd1');
  });

  test('données d’exemple : 36 séances et des objectifs cohérents', () => {
    const d = sampleData(Date.UTC(2026, 9, 23, 12));
    assert.equal(d.sessions.length, 36);
    for (const day of d.days) {
      for (const ex of day.exercises) assert.notEqual(recFor(d, ex).kind, 'first');
    }
  });
});
