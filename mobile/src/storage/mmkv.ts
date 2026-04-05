import type { MMKV } from 'react-native-mmkv';
import { createMMKV } from 'react-native-mmkv';

export const MMKV_ID = 'workbit';

let instance: MMKV | undefined;
let initFailed = false;

/**
 * Lazily opens MMKV on first use so native Nitro/JSI is ready and a failed init
 * does not crash the bundle at import time (which would show a blank screen).
 */
export function getMmkv(): MMKV | undefined {
  if (instance) {
    return instance;
  }
  if (initFailed) {
    return undefined;
  }
  try {
    instance = createMMKV({ id: MMKV_ID });
    return instance;
  } catch (e) {
    initFailed = true;
    if (__DEV__) {
      console.warn('[workbit] MMKV unavailable; using in-memory fallbacks', e);
    }
    return undefined;
  }
}

export function storageGetJson<T>(key: string): T | undefined {
  const m = getMmkv();
  if (!m) {
    return undefined;
  }
  const raw = m.getString(key);
  if (raw == null) {
    return undefined;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function storageSetJson(key: string, value: unknown): void {
  const m = getMmkv();
  if (!m) {
    return;
  }
  m.set(key, JSON.stringify(value));
}

export function storageRemove(key: string): boolean {
  const m = getMmkv();
  return m ? m.remove(key) : false;
}

export function storageHas(key: string): boolean {
  const m = getMmkv();
  return m ? m.contains(key) : false;
}
