import { useState, useEffect } from 'react';

export function useAgentMemory(agentId: string | undefined) {
  const [memory, setMemory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setMemory(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function fetchMemory() {
      try {
        const res = await fetch(`/agents/${agentId}/memory`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { content: string } = await res.json();
        if (!cancelled) {
          setMemory(data.content);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch memory');
          setLoading(false);
        }
      }
    }

    fetchMemory();
    return () => { cancelled = true; };
  }, [agentId]);

  return { memory, loading, error };
}
