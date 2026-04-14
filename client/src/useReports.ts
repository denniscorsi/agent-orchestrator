import { useState, useEffect } from 'react';
import type { Report } from './types';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchReports() {
      try {
        const res = await fetch('/reports');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Report[] = await res.json();
        if (!cancelled) {
          setReports(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch reports');
          setLoading(false);
        }
      }
    }

    fetchReports();
    return () => { cancelled = true; };
  }, []);

  return { reports, loading, error };
}
