import { renderHook, act } from '@testing-library/react';
import { useReadStatus } from '../useReadStatus';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

describe('useReadStatus', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
    localStorageMock.clear();
  });

  it('starts with empty read set', () => {
    const { result } = renderHook(() => useReadStatus());
    expect(result.current.isRead('test.md')).toBe(false);
  });

  it('marks a report as read', () => {
    const { result } = renderHook(() => useReadStatus());
    act(() => {
      result.current.markRead('test.md');
    });
    expect(result.current.isRead('test.md')).toBe(true);
  });

  it('persists read status to localStorage', () => {
    const { result } = renderHook(() => useReadStatus());
    act(() => {
      result.current.markRead('test.md');
    });
    const stored = JSON.parse(localStorageMock.getItem('reports-read')!);
    expect(stored).toContain('test.md');
  });

  it('loads read status from localStorage', () => {
    localStorageMock.setItem('reports-read', JSON.stringify(['already-read.md']));
    const { result } = renderHook(() => useReadStatus());
    expect(result.current.isRead('already-read.md')).toBe(true);
    expect(result.current.isRead('unread.md')).toBe(false);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorageMock.setItem('reports-read', 'not-json');
    const { result } = renderHook(() => useReadStatus());
    expect(result.current.isRead('test.md')).toBe(false);
  });

  it('does not duplicate entries when marking same file twice', () => {
    const { result } = renderHook(() => useReadStatus());
    act(() => {
      result.current.markRead('test.md');
    });
    act(() => {
      result.current.markRead('test.md');
    });
    const stored = JSON.parse(localStorageMock.getItem('reports-read')!);
    expect(stored.filter((f: string) => f === 'test.md')).toHaveLength(1);
  });
});
