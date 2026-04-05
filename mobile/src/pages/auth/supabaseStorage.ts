import { getMmkv } from '../../storage/mmkv';

/**
 * Supabase auth session persistence via MMKV (same process as the rest of the app).
 */
export const supabaseAuthStorage = {
  getItem: (key: string): string | null => {
    const m = getMmkv();
    if (!m) {
      return null;
    }
    return m.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    getMmkv()?.set(key, value);
  },
  removeItem: (key: string): void => {
    getMmkv()?.remove(key);
  },
};
