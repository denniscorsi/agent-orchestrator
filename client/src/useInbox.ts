import { useState, useEffect, useCallback } from 'react';
import type { InboxMessage } from './types';

export function useInbox() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch('/inbox');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: InboxMessage[] = await res.json();
      setMessages(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inbox');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      await fetchInbox();
      if (cancelled) return;
    }

    load();
    return () => { cancelled = true; };
  }, [fetchInbox]);

  const refetch = useCallback(() => {
    fetchInbox();
  }, [fetchInbox]);

  return { messages, loading, error, refetch };
}
