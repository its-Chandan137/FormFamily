import { PERSISTENCE_KEY } from '@/lib/constants';

export interface PersistedState {
  version: 1;
  data: unknown;
  savedAt: string;
}

function canUseStorage(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
  );
}

export function loadPersistedState<T>(): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(PERSISTENCE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || parsed.version !== 1) return null;
    return parsed.data as T;
  } catch {
    return null;
  }
}

export function savePersistedState<T>(data: T): void {
  if (!canUseStorage()) return;
  try {
    const payload: PersistedState = {
      version: 1,
      data,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota/serialization errors in demo mode
  }
}

export function clearPersistedState(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(PERSISTENCE_KEY);
  } catch {
    // ignore
  }
}
