import { useCallback, useState } from 'react';
import { storage } from '../platform/storage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback(
    (next: T) => {
      setValue(next);
      try {
        storage.setItem(key, JSON.stringify(next));
      } catch {
        // noop
      }
    },
    [key],
  );

  return [value, setStoredValue] as const;
}
