import { useState, useEffect } from 'react';
import type { InboxMessage } from './types';

export function useInbox() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchInbox() {
      try {
        const res = await fetch('/inbox');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InboxMessage[] = await res.json();
        if (!cancelled) {
          setMessages(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch inbox');
          setLoading(false);
        }
      }
    }

    fetchInbox();
    return () => { cancelled = true; };
  }, []);

  return { messages, loading, error };
}
