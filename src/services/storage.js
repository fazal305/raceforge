const STORAGE_PREFIX = 'raceforge';
const SCHEMA_VERSION = 1;

function buildKey(key) {
  return `${STORAGE_PREFIX}:${key}`;
}

function isStorageAvailable() {
  try {
    const testKey = buildKey('__probe__');
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const available = typeof window !== 'undefined' && isStorageAvailable();

/**
 * Thin, safe wrapper around localStorage. Every value is stored with a
 * schema version so a future shape change can migrate or discard stale data
 * instead of throwing at parse time.
 */
export const storage = {
  isAvailable() {
    return available;
  },

  read(key, fallback) {
    if (!available) return fallback;
    try {
      const raw = window.localStorage.getItem(buildKey(key));
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== SCHEMA_VERSION) return fallback;
      return parsed.value;
    } catch {
      return fallback;
    }
  },

  write(key, value) {
    if (!available) return false;
    try {
      window.localStorage.setItem(
        buildKey(key),
        JSON.stringify({ version: SCHEMA_VERSION, value }),
      );
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    if (!available) return;
    try {
      window.localStorage.removeItem(buildKey(key));
    } catch {
      /* ignore */
    }
  },

  clearAll(keys) {
    keys.forEach((key) => storage.remove(key));
  },
};
