// Progression engine and training data operations.
// Same rules as RareCandyKit/ProgressionEngine.swift (double progression):
// +1 rep per set each session, capped at the top of the rep range; once every
// planned set reaches the top, add the weight increment and go back to the bottom.

export const DAY_MS = 86_400_000;
/** Sessions without progress before the stall warning shows. */
export const STALL_SESSIONS = 3;
const TOLERANCE = 0.001;

export type RepRange = { lower: number; upper: number };

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  targetSets: number;
  repRange: RepRange;
  /** Kilos added once every set reaches the top of the range. 0 = reps only, no cap. */
  weightIncrement: number;
  restSec: number;
  notes: string;
};

export type TrainingDay = { id: string; name: string; exercises: Exercise[] };

export type SetLog = { reps: number; weight: number };

export type ExerciseLog = { id: string; exerciseId: string; exerciseName: string; sets: SetLog[] };

export type Session = {
  id: string;
  dayId: string;
  dayName: string;
  date: number;
  duration: number;
  exercises: ExerciseLog[];
};

/** A planned set. `weight` is null on a first session, when the user picks the load. */
export type SetTarget = { reps: number; weight: number | null };

export type HistoryEntry = { sessionId: string; date: number; log: ExerciseLog };

type RecommendationBase = {
  targets: SetTarget[];
  repRange: RepRange;
  weightIncrement: number;
  last: HistoryEntry | null;
  /** Sessions in a row without progress. */
  stall: number;
};

export type Recommendation =
  | (RecommendationBase & { kind: 'first' })
  | (RecommendationBase & { kind: 'addReps' })
  | (RecommendationBase & { kind: 'increase'; from: number; to: number });

export type Outcome = 'met' | 'exceeded' | 'missed' | 'none';

export type ActiveSet = {
  id: string;
  reps: number;
  weight: number;
  target: SetTarget | null;
  previous: SetLog | null;
  done: boolean;
};

export type ActiveExercise = {
  exerciseId: string;
  name: string;
  muscle: string;
  restSec: number;
  rec: Recommendation;
  sets: ActiveSet[];
};

export type RestTimer = { endsAt: number; total: number; name: string };

export type ActiveWorkout = {
  id: string;
  dayId: string;
  dayName: string;
  startedAt: number;
  rest: RestTimer | null;
  exercises: ActiveExercise[];
};

export type TrainingData = { days: TrainingDay[]; sessions: Session[]; active: ActiveWorkout | null };

export type ExerciseResult = {
  exerciseId: string;
  name: string;
  performed: SetLog[];
  target: Recommendation;
  outcome: Outcome;
  records: string[];
  next: Recommendation | null;
};

export type WorkoutSummary = {
  session: Session;
  count: number;
  volume: number;
  sets: number;
  records: number;
  exercises: ExerciseResult[];
};

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function round2(w: number): number {
  return Math.round(w * 100) / 100;
}

/** The last sets, padded with copies of the final set (or cut) to `count`. */
export function aligned<T>(sets: T[], count: number): T[] {
  if (!sets.length) return [];
  if (sets.length >= count) return sets.slice(0, count);
  const out = sets.slice();
  while (out.length < count) out.push(sets[sets.length - 1]);
  return out;
}

export function topWeight(log: ExerciseLog): number {
  return log.sets.reduce((m, s) => Math.max(m, s.weight), 0);
}

export function totalReps(log: ExerciseLog): number {
  return log.sets.reduce((a, s) => a + s.reps, 0);
}

export function volume(log: ExerciseLog): number {
  return log.sets.reduce((a, s) => a + s.reps * s.weight, 0);
}

/** Estimated one-rep max (Epley). */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function bestE1rm(log: ExerciseLog): number {
  return log.sets.reduce((m, s) => Math.max(m, e1rm(s.weight, s.reps)), 0);
}

export function isImprovement(current: ExerciseLog, previous: ExerciseLog): boolean {
  const a = topWeight(current);
  const b = topWeight(previous);
  if (Math.abs(a - b) > TOLERANCE) return a > b;
  return totalReps(current) > totalReps(previous);
}

export function sessionsWithoutProgress(history: HistoryEntry[]): number {
  let count = 0;
  for (let i = history.length - 1; i > 0; i--) {
    if (isImprovement(history[i].log, history[i - 1].log)) break;
    count++;
  }
  return count;
}

export function recommend(ex: Exercise, history: HistoryEntry[]): Recommendation {
  const setCount = Math.max(1, ex.targetSets);
  const range = ex.repRange;
  const inc = Math.max(0, ex.weightIncrement);
  const performed = history.filter((r) => r.log.sets.length > 0);
  const last = performed[performed.length - 1];
  const base = { repRange: range, weightIncrement: inc, last: last ?? null, stall: 0 };

  if (!last) {
    const targets = Array.from({ length: setCount }, () => ({ reps: range.lower, weight: null }));
    return { ...base, kind: 'first', targets };
  }

  const prev = aligned(last.log.sets, setCount);
  const didAll = last.log.sets.length >= setCount;
  const reachedTop = inc > 0 && didAll && prev.every((s) => s.reps >= range.upper);
  base.stall = sessionsWithoutProgress(performed);

  if (reachedTop) {
    const from = Math.max(...prev.map((s) => s.weight));
    return {
      ...base,
      kind: 'increase',
      from,
      to: round2(from + inc),
      targets: prev.map((s) => ({ reps: range.lower, weight: round2(s.weight + inc) })),
    };
  }
  return {
    ...base,
    kind: 'addReps',
    targets: prev.map((s) => {
      const reps = inc > 0 ? Math.min(s.reps + 1, range.upper) : s.reps + 1;
      return { reps: Math.max(reps, 1), weight: s.weight };
    }),
  };
}

export function evaluate(sets: SetLog[], rec: Recommendation): Outcome {
  if (rec.kind === 'first') return 'none';
  const t = rec.targets;
  if (!t.length) return 'none';
  if (sets.length < t.length) return 'missed';
  let exceeded = false;
  for (let i = 0; i < t.length; i++) {
    const tw = t[i].weight ?? 0;
    if (sets[i].reps < t[i].reps || sets[i].weight < tw - TOLERANCE) return 'missed';
    if (sets[i].reps > t[i].reps || sets[i].weight > tw + TOLERANCE) exceeded = true;
  }
  return exceeded ? 'exceeded' : 'met';
}

// ---------- Data ----------

export function emptyData(): TrainingData {
  return { days: [], sessions: [], active: null };
}

export function sessionsByDate(d: TrainingData): Session[] {
  return d.sessions
    .map((s, i) => [s, i] as const)
    .sort((a, b) => (a[0].date !== b[0].date ? a[0].date - b[0].date : a[1] - b[1]))
    .map((x) => x[0]);
}

export function historyOf(d: TrainingData, exerciseId: string): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (const s of sessionsByDate(d)) {
    for (const log of s.exercises) {
      if (log.exerciseId === exerciseId) out.push({ sessionId: s.id, date: s.date, log });
    }
  }
  return out;
}

export function recFor(d: TrainingData, ex: Exercise): Recommendation {
  return recommend(ex, historyOf(d, ex.id));
}

export function findDay(d: TrainingData, id: string): TrainingDay | null {
  return d.days.find((x) => x.id === id) ?? null;
}

export function findExercise(d: TrainingData, id: string): { exercise: Exercise; day: TrainingDay } | null {
  for (const day of d.days) {
    const exercise = day.exercises.find((x) => x.id === id);
    if (exercise) return { exercise, day };
  }
  return null;
}

export function dayIndex(d: TrainingData, id: string): number {
  return d.days.findIndex((x) => x.id === id);
}

/** The day after the last session in the rotation, skipping days without exercises. */
export function nextDay(d: TrainingData): TrainingDay | null {
  const usable = d.days.filter((x) => x.exercises.length > 0);
  if (!usable.length) return d.days[0] ?? null;
  const sorted = sessionsByDate(d);
  const last = sorted[sorted.length - 1];
  const i = last ? dayIndex(d, last.dayId) : -1;
  for (let k = 1; k <= d.days.length; k++) {
    const candidate = d.days[(i + k + d.days.length) % d.days.length];
    if (candidate.exercises.length) return candidate;
  }
  return usable[0];
}

export function lastDate(d: TrainingData, dayId: string): number | null {
  let latest: number | null = null;
  for (const s of d.sessions) {
    if (s.dayId === dayId && (latest === null || s.date > latest)) latest = s.date;
  }
  return latest;
}

export function sessionVolume(s: Session): number {
  return s.exercises.reduce((a, l) => a + volume(l), 0);
}

export function sessionSets(s: Session): number {
  return s.exercises.reduce((a, l) => a + l.sets.length, 0);
}

export function startWorkout(d: TrainingData, dayId: string, now = Date.now()): TrainingData {
  const day = findDay(d, dayId);
  if (!day) return d;
  const active: ActiveWorkout = {
    id: uid(),
    dayId,
    dayName: day.name,
    startedAt: now,
    rest: null,
    exercises: day.exercises.map((ex) => {
      const rec = recFor(d, ex);
      const prev = rec.last ? aligned(rec.last.log.sets, rec.targets.length) : [];
      return {
        exerciseId: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        restSec: ex.restSec,
        rec,
        sets: rec.targets.map((t, i) => ({
          id: uid(),
          reps: t.reps,
          weight: t.weight ?? 0,
          target: t,
          previous: prev[i] ?? null,
          done: false,
        })),
      };
    }),
  };
  return { ...d, active };
}

/** Records beaten by a session, compared with all the history before it. */
export function recordsBeaten(before: HistoryEntry[], log: ExerciseLog): string[] {
  if (!before.length) return [];
  const out: string[] = [];
  const bestE = Math.max(...before.map((r) => bestE1rm(r.log)));
  const bestW = Math.max(...before.map((r) => topWeight(r.log)));
  const bestV = Math.max(...before.map((r) => volume(r.log)));
  if (bestE1rm(log) > bestE + TOLERANCE) out.push('1RM estimé');
  if (topWeight(log) > bestW + TOLERANCE) out.push('charge max');
  if (volume(log) > bestV + TOLERANCE) out.push('volume');
  return out;
}

/** Saves the validated sets as a session. Null when no set was validated. */
export function finishWorkout(
  d: TrainingData,
  now = Date.now(),
): { data: TrainingData; summary: WorkoutSummary } | null {
  const w = d.active;
  if (!w) return null;
  const performed = w.exercises
    .map((ex) => ({ ex, sets: ex.sets.filter((s) => s.done).map((s) => ({ reps: s.reps, weight: s.weight })) }))
    .filter((p) => p.sets.length > 0);
  if (!performed.length) return null;

  const before = new Map(performed.map((p) => [p.ex.exerciseId, historyOf(d, p.ex.exerciseId)]));
  const session: Session = {
    id: w.id,
    dayId: w.dayId,
    dayName: w.dayName,
    date: w.startedAt,
    duration: Math.max(60_000, now - w.startedAt),
    exercises: performed.map((p) => ({ id: uid(), exerciseId: p.ex.exerciseId, exerciseName: p.ex.name, sets: p.sets })),
  };
  const data: TrainingData = { ...d, sessions: [...d.sessions, session], active: null };

  const exercises = performed.map((p, i): ExerciseResult => {
    const found = findExercise(data, p.ex.exerciseId);
    return {
      exerciseId: p.ex.exerciseId,
      name: p.ex.name,
      performed: p.sets,
      target: p.ex.rec,
      outcome: evaluate(p.sets, p.ex.rec),
      records: recordsBeaten(before.get(p.ex.exerciseId) ?? [], session.exercises[i]),
      next: found ? recFor(data, found.exercise) : null,
    };
  });
  return {
    data,
    summary: {
      session,
      count: data.sessions.length,
      volume: sessionVolume(session),
      sets: sessionSets(session),
      records: exercises.filter((e) => e.records.length > 0).length,
      exercises,
    },
  };
}

// ---------- Stats ----------

export type WeekStats = { start: number; volume: number; reps: number; sessions: number };

export function startOfWeek(ms: number): number {
  const x = new Date(ms);
  x.setHours(0, 0, 0, 0);
  const dow = (x.getDay() + 6) % 7;
  return x.getTime() - dow * DAY_MS;
}

export function weeklyStats(d: TrainingData, weeks: number, now = Date.now()): WeekStats[] {
  const current = startOfWeek(now);
  const out: WeekStats[] = [];
  for (let i = weeks - 1; i >= 0; i--) out.push({ start: current - i * 7 * DAY_MS, volume: 0, reps: 0, sessions: 0 });
  for (const s of d.sessions) {
    const ws = startOfWeek(s.date);
    // Half a day of slack absorbs daylight saving shifts.
    const bucket = out.find((x) => Math.abs(x.start - ws) < DAY_MS / 2);
    if (!bucket) continue;
    bucket.sessions++;
    bucket.volume += sessionVolume(s);
    bucket.reps += s.exercises.reduce((a, l) => a + totalReps(l), 0);
  }
  return out;
}

/** Weeks in a row with at least one session, not counting an empty current week. */
export function weekStreak(d: TrainingData, now = Date.now()): number {
  const weeks = weeklyStats(d, 52, now);
  let i = weeks.length - 1;
  let n = 0;
  if (weeks[i].sessions === 0) i--;
  for (; i >= 0 && weeks[i].sessions > 0; i--) n++;
  return n;
}

export type ExerciseRecords = {
  e1rm: { value: number; set: SetLog; date: number } | null;
  heaviest: { set: SetLog; date: number } | null;
  volume: { value: number; date: number } | null;
  sessions: number;
};

export function exerciseRecords(d: TrainingData, exerciseId: string): ExerciseRecords | null {
  const h = historyOf(d, exerciseId);
  if (!h.length) return null;
  let bestE: ExerciseRecords['e1rm'] = null;
  let heaviest: ExerciseRecords['heaviest'] = null;
  let bestVol: ExerciseRecords['volume'] = null;
  for (const r of h) {
    for (const s of r.log.sets) {
      const e = e1rm(s.weight, s.reps);
      if (!bestE || e > bestE.value) bestE = { value: e, set: s, date: r.date };
      if (!heaviest || s.weight > heaviest.set.weight || (s.weight === heaviest.set.weight && s.reps > heaviest.set.reps)) {
        heaviest = { set: s, date: r.date };
      }
    }
    const v = volume(r.log);
    if (!bestVol || v > bestVol.value) bestVol = { value: v, date: r.date };
  }
  return { e1rm: bestE, heaviest, volume: bestVol, sessions: h.length };
}
