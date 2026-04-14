import { useState, useCallback } from 'react';

const STORAGE_KEY = 'reports-read';

function loadReadSet(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return new Set(JSON.parse(stored) as string[]);
  } catch { /* ignore corrupt data */ }
  return new Set();
}

function saveReadSet(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function useReadStatus() {
  const [readSet, setReadSet] = useState<Set<string>>(loadReadSet);

  const isRead = useCallback((filename: string) => readSet.has(filename), [readSet]);

  const markRead = useCallback((filename: string) => {
    setReadSet((prev) => {
      if (prev.has(filename)) return prev;
      const next = new Set(prev);
      next.add(filename);
      saveReadSet(next);
      return next;
    });
  }, []);

  return { isRead, markRead };
}
