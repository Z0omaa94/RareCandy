// App state: training data and settings, kept in memory and saved to local storage.
// Native uses expo-sqlite's localStorage polyfill; web has its own localStorage.
import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';

import { emptyData, type TrainingData, type WorkoutSummary } from '@/core/engine';
import { sampleData } from '@/core/sample';

const DATA_KEY = 'rarecandy.data.v1';
const SETTINGS_KEY = 'rarecandy.settings.v1';

export type ThemePreference = 'light' | 'dark' | 'auto';
export type Settings = { theme: ThemePreference };

function read<T>(key: string, valid: (x: unknown) => x is T): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return valid(value) ? value : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private browsing): the app keeps working in memory.
  }
}

const isData = (x: unknown): x is TrainingData =>
  typeof x === 'object' && x !== null && Array.isArray((x as TrainingData).days) && Array.isArray((x as TrainingData).sessions);
const isSettings = (x: unknown): x is Settings => typeof x === 'object' && x !== null && 'theme' in x;

let data: TrainingData = read(DATA_KEY, isData) ?? sampleData();
let settings: Settings = read(SETTINGS_KEY, isSettings) ?? { theme: 'auto' };
let summary: WorkoutSummary | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Replaces the training data and saves it shortly after (typing stays smooth). */
export function setData(next: TrainingData) {
  data = next;
  emit();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => write(DATA_KEY, data), 250);
}

/** Applies `change` to a copy of the data. */
export function update(change: (draft: TrainingData) => void) {
  const draft: TrainingData = JSON.parse(JSON.stringify(data));
  change(draft);
  setData(draft);
}

export function getData() {
  return data;
}

export function resetData(kind: 'sample' | 'empty') {
  setData(kind === 'sample' ? sampleData() : emptyData());
}

export function setSettings(next: Partial<Settings>) {
  settings = { ...settings, ...next };
  write(SETTINGS_KEY, settings);
  emit();
}

export function setSummary(next: WorkoutSummary | null) {
  summary = next;
  emit();
}

export function useData(): TrainingData {
  return useSyncExternalStore(subscribe, () => data, () => data);
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, () => settings, () => settings);
}

export function useSummary(): WorkoutSummary | null {
  return useSyncExternalStore(subscribe, () => summary, () => summary);
}
