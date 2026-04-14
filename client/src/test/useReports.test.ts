import { renderHook, waitFor } from '@testing-library/react';
import { useReports } from '../useReports';
import type { Report } from '../types';

const mockReports: Report[] = [
  {
    filename: 'test-report.md',
    title: 'Test Report',
    agent: 'CFO',
    date: '2026-04-01',
    summary: 'Test summary.',
    content: '# Test Report\n\nContent.',
  },
];

describe('useReports', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading state', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useReports());
    expect(result.current.loading).toBe(true);
    expect(result.current.reports).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches and returns reports', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReports),
    });
    const { result } = renderHook(() => useReports());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.reports).toEqual(mockReports);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    const { result } = renderHook(() => useReports());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('HTTP 500');
    expect(result.current.reports).toEqual([]);
  });

  it('sets error on network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useReports());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Network error');
  });

  it('calls /reports endpoint', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    renderHook(() => useReports());
    expect(globalThis.fetch).toHaveBeenCalledWith('/reports');
  });
});
