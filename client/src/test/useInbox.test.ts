import { renderHook, waitFor } from '@testing-library/react';
import { useInbox } from '../useInbox';
import type { InboxMessage } from '../types';

const mockMessages: InboxMessage[] = [
  {
    to: 'CFO',
    from: 'Market Researcher',
    date: '2026-04-10',
    subject: 'RWA Market Data',
    body: 'Here is the latest market data.',
    archived: false,
  },
  {
    to: 'Dennis',
    from: 'CFO',
    date: '2026-04-12',
    subject: 'March Numbers Summary',
    body: 'March closed at $142K revenue.',
    archived: false,
  },
];

describe('useInbox', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with loading state', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useInbox());
    expect(result.current.loading).toBe(true);
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('fetches and returns messages', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMessages),
    });
    const { result } = renderHook(() => useInbox());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.error).toBeNull();
  });

  it('sets error on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    const { result } = renderHook(() => useInbox());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('HTTP 500');
    expect(result.current.messages).toEqual([]);
  });

  it('sets error on network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useInbox());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Network error');
  });

  it('calls /inbox endpoint', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    renderHook(() => useInbox());
    expect(globalThis.fetch).toHaveBeenCalledWith('/inbox');
  });
});
