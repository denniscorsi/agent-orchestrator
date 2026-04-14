import { useState, useEffect } from 'react';
import type { Agent } from './types';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAgents() {
      try {
        const res = await fetch('/agents');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Agent[] = await res.json();
        if (!cancelled) {
          setAgents(data.map((a) => ({ ...a, status: a.status ?? 'idle' })));
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch agents');
          setLoading(false);
        }
      }
    }

    fetchAgents();
    return () => { cancelled = true; };
  }, []);

  return { agents, loading, error };
}
