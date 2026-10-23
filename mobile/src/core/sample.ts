// Exercise library and an example program with 12 weeks of simulated history.
import {
  DAY_MS,
  historyOf,
  recommend,
  uid,
  type Exercise,
  type Session,
  type SetLog,
  type TrainingData,
  type TrainingDay,
} from './engine.ts';

export type LibraryItem = { name: string; muscle: string; increment: number };

export const LIBRARY: LibraryItem[] = (
  [
    ['Développé couché', 'Pectoraux', 2.5],
    ['Développé incliné haltères', 'Pectoraux', 2],
    ['Écarté à la poulie', 'Pectoraux', 2.5],
    ['Dips', 'Pectoraux', 2.5],
    ['Pompes', 'Pectoraux', 0],
    ['Tractions', 'Dos', 2.5],
    ['Rowing barre', 'Dos', 2.5],
    ['Tirage vertical', 'Dos', 2.5],
    ['Rowing haltère', 'Dos', 2],
    ['Soulevé de terre', 'Dos', 5],
    ['Squat', 'Jambes', 5],
    ['Presse à cuisses', 'Jambes', 10],
    ['Leg curl', 'Jambes', 2.5],
    ['Leg extension', 'Jambes', 2.5],
    ['Fentes haltères', 'Jambes', 2],
    ['Hip thrust', 'Jambes', 5],
    ['Mollets debout', 'Jambes', 5],
    ['Développé militaire', 'Épaules', 2.5],
    ['Élévations latérales', 'Épaules', 1],
    ['Face pull', 'Épaules', 2.5],
    ['Curl biceps haltères', 'Bras', 1],
    ['Curl barre', 'Bras', 2.5],
    ['Extension triceps poulie', 'Bras', 2.5],
    ['Barre au front', 'Bras', 2.5],
  ] as const
).map(([name, muscle, increment]) => ({ name, muscle, increment }));

export function newExercise(name: string, muscle: string, increment: number, lower = 10, upper = 15, sets = 3): Exercise {
  return {
    id: uid(),
    name,
    muscle: muscle || 'Autre',
    targetSets: sets,
    repRange: { lower, upper },
    weightIncrement: increment,
    restSec: 90,
    notes: '',
  };
}

export function sampleProgram(): TrainingDay[] {
  return [
    {
      id: uid(),
      name: 'Pecs',
      exercises: [
        newExercise('Développé couché', 'Pectoraux', 2.5),
        newExercise('Développé incliné haltères', 'Pectoraux', 2),
        newExercise('Écarté à la poulie', 'Pectoraux', 2.5),
        newExercise('Dips', 'Pectoraux', 2.5),
        newExercise('Extension triceps poulie', 'Bras', 2.5),
      ],
    },
    {
      id: uid(),
      name: 'Dos',
      exercises: [
        newExercise('Tractions', 'Dos', 2.5, 6, 12),
        newExercise('Rowing barre', 'Dos', 2.5),
        newExercise('Tirage vertical', 'Dos', 2.5),
        newExercise('Curl biceps haltères', 'Bras', 1),
      ],
    },
    {
      id: uid(),
      name: 'Jambes',
      exercises: [
        newExercise('Squat', 'Jambes', 5),
        newExercise('Presse à cuisses', 'Jambes', 10),
        newExercise('Leg curl', 'Jambes', 2.5),
        newExercise('Mollets debout', 'Jambes', 5, 12, 20),
      ],
    },
  ];
}

// Starting sets and weight, then one letter per later session:
// h = target hit, m = same as last time, x = target beaten by one rep.
type Script = [reps: number[], weight: number, steps: string];
const SCRIPTS: Script[][] = [
  [
    [[11, 11, 11], 55, 'hhhhhhhhhhh'],
    [[10, 10, 9], 20, 'hhmhhxhhmhh'],
    [[10, 10, 10], 12.5, 'hhhhhhhhhhh'],
    [[6, 6, 5], 0, 'hhmhhhhhhhh'],
    [[10, 10, 10], 22.5, 'hhhhhhhmmmm'],
  ],
  [
    [[6, 6, 5], 0, 'hhhmhhhhmhh'],
    [[10, 10, 10], 45, 'hhxhhmhhhhh'],
    [[12, 12, 11], 50, 'hhhmhhhhhmh'],
    [[10, 10, 10], 10, 'hhhhhhxhhhh'],
  ],
  [
    [[10, 10, 10], 70, 'hhmhhhhmhhh'],
    [[10, 10, 10], 120, 'hhhhhhhhhhh'],
    [[10, 10, 9], 30, 'hmhhhhmhhhh'],
    [[12, 12, 12], 50, 'hhhhmhhhhhh'],
  ],
];
const ROTATIONS = 12;

export function sampleData(now = Date.now()): TrainingData {
  const days = sampleProgram();
  const data: TrainingData = { days, sessions: [], active: null };
  const end = new Date(now);
  end.setHours(18, 30, 0, 0);
  const total = ROTATIONS * days.length;
  for (let r = 0; r < ROTATIONS; r++) {
    days.forEach((day, di) => {
      const i = r * days.length + di;
      const session: Session = {
        id: uid(),
        dayId: day.id,
        dayName: day.name,
        date: end.getTime() - (2 + (total - 1 - i) * 2) * DAY_MS,
        duration: (46 + ((i * 7) % 23)) * 60_000,
        exercises: [],
      };
      day.exercises.forEach((ex, ei) => {
        const [startReps, startWeight, steps] = SCRIPTS[di][ei];
        let sets: SetLog[];
        if (r === 0) {
          sets = startReps.map((reps) => ({ reps, weight: startWeight }));
        } else {
          const h = historyOf(data, ex.id);
          const step = steps[r - 1];
          if (step === 'm') {
            sets = h[h.length - 1].log.sets.map((s) => ({ ...s }));
          } else {
            sets = recommend(ex, h).targets.map((t, k) => ({
              reps: t.reps + (step === 'x' && k === 0 ? 1 : 0),
              weight: t.weight ?? startWeight,
            }));
          }
        }
        session.exercises.push({ id: uid(), exerciseId: ex.id, exerciseName: ex.name, sets });
      });
      data.sessions.push(session);
    });
  }
  return data;
}
