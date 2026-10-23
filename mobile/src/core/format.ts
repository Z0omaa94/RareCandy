// French text formatting. Written by hand rather than with Intl, which Hermes
// only partly implements (no RelativeTimeFormat).
import { DAY_MS, STALL_SESSIONS, type Recommendation, type SetLog, type SetTarget } from './engine.ts';

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const NBSP = ' ';

/** 62.5 → "62,5"; at most two decimals, no grouping. */
export function num(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

/** 12345.6 → "12 346" with a narrow no-break space. */
export function big(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export function weight(w: number): string {
  return w > 0 ? `${num(w)} kg` : 'poids du corps';
}

/** Parses "62,5" or "62.5"; null when it is not a number between 0 and 10 000. */
export function parseNum(text: string): number | null {
  const t = text.trim();
  const v = Number(t.replace(',', '.'));
  if (t === '' || !Number.isFinite(v) || v < 0 || v > 10_000) return null;
  return v;
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n > 1 ? 's' : ''}`;
}

type Group = { count: number; reps: number; weight: number | null };

function groupSets(list: (SetTarget | SetLog)[]): Group[] {
  const groups: Group[] = [];
  for (const t of list) {
    const w = t.weight ?? null;
    const last = groups[groups.length - 1];
    if (last && last.reps === t.reps && last.weight === w) last.count++;
    else groups.push({ count: 1, reps: t.reps, weight: w });
  }
  return groups;
}

/** "3 × 11 · 60 kg", or "2 × 12 · 60 kg + 1 × 11 · 60 kg". */
export function fmtSets(list: (SetTarget | SetLog)[]): string {
  return groupSets(list)
    .map((g) => `${g.count} × ${g.reps}${g.weight != null ? ` · ${weight(g.weight)}` : ''}`)
    .join(' + ');
}

/** "60 kg × 10", or "10" for body weight. */
export function fmtSet(s: SetLog): string {
  return (s.weight > 0 ? `${num(s.weight)} kg × ` : '') + s.reps;
}

export function fmtDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function fmtDateLong(ms: number): string {
  const d = new Date(ms);
  const s = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtMonth(year: number, month: number): string {
  const s = `${MONTHS_LONG[month]} ${year}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function startOfDay(ms: number): number {
  const x = new Date(ms);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

/** "aujourd’hui", "hier", "il y a 5 jours". */
export function fmtRel(ms: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ms)) / DAY_MS);
  if (days <= 0) return 'aujourd’hui';
  if (days === 1) return 'hier';
  if (days === 2) return 'avant-hier';
  return `il y a ${days} jours`;
}

export function fmtDuration(ms: number): string {
  const m = Math.round(ms / 60_000);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`;
}

/** Stopwatch: "4:07" or "1:02:09". */
export function fmtClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h ? `${h}:${String(m).padStart(2, '0')}` : m}:${String(sec).padStart(2, '0')}`;
}

export function fmtRest(sec: number): string {
  if (!sec) return 'Désactivé';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (m ? `${m} min` : '') + (s ? `${m ? ' ' : ''}${s} s` : '');
}

export function goalText(rec: Recommendation): string {
  if (rec.kind === 'first') return `${rec.targets.length} × ${rec.repRange.lower} reps`;
  return fmtSets(rec.targets);
}

export function adviceText(rec: Recommendation): string {
  const r = rec.repRange;
  if (rec.kind === 'first') {
    return `Première fois : choisis une charge avec laquelle tu fais ${r.lower} reps propres sur chaque série.`;
  }
  if (rec.kind === 'increase') {
    return `Tu as fait ${r.upper} reps partout : passe de ${weight(rec.from)} à ${weight(rec.to)} et repars à ${r.lower} reps.`;
  }
  if (rec.weightIncrement <= 0) return 'Ajoute une rep sur chaque série.';
  return `Une rep de plus par série. À ${r.upper} reps sur toutes les séries, tu monteras de ${weight(rec.weightIncrement)}.`;
}

export function stallText(rec: Recommendation): string | null {
  if (rec.stall < STALL_SESSIONS) return null;
  return `Pas de progrès depuis ${rec.stall} séances : vérifie ton sommeil et ta récup, ou fais une semaine plus légère (-10 %).`;
}

export function goalLabel(target: SetTarget): string {
  return `Objectif ${target.reps} reps${target.weight != null ? ` · ${weight(target.weight)}` : ''}`;
}
