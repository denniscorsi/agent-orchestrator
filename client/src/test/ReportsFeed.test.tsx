import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportsFeed from '../components/ReportsFeed';
import type { Report } from '../types';

const mockReports: Report[] = [
  {
    filename: 'market-trends-q1-2026.md',
    title: 'Q1 2026 Market Trends Report',
    agent: 'Market Researcher',
    date: '2026-04-07',
    summary: 'The tokenized real-world asset market grew 34% quarter-over-quarter.',
    content: '# Q1 2026 Market Trends Report\n\nFull content.',
  },
  {
    filename: 'financial-review-march-2026.md',
    title: 'March 2026 Financial Review',
    agent: 'CFO',
    date: '2026-04-01',
    summary: 'March revenue came in at $142K, slightly above the $135K forecast.',
    content: '# March 2026 Financial Review\n\n**Author:** CFO\n\nFull content.',
  },
];

function mockFetchReports(reports: Report[] = mockReports) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(reports),
  });
}

function mockFetchError() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
  });
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

describe('ReportsFeed', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<ReportsFeed />);
    expect(screen.getByText('Loading reports...')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    mockFetchError();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText(/Error: HTTP 500/)).toBeInTheDocument();
    });
  });

  it('renders report cards after loading', async () => {
    mockFetchReports();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    expect(screen.getByText('March 2026 Financial Review')).toBeInTheDocument();
  });

  it('shows empty state when no reports exist', async () => {
    mockFetchReports([]);
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('No reports yet.')).toBeInTheDocument();
    });
  });

  it('fetches from /reports endpoint', async () => {
    mockFetchReports();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/reports');
    });
  });

  it('shows report detail when Read more is clicked', async () => {
    mockFetchReports();
    const user = userEvent.setup();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('read-more-market-trends-q1-2026.md'));
    expect(screen.getByTestId('report-detail')).toBeInTheDocument();
    expect(screen.queryByTestId('report-filters')).not.toBeInTheDocument();
  });

  it('returns to feed when back button is clicked', async () => {
    mockFetchReports();
    const user = userEvent.setup();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('read-more-market-trends-q1-2026.md'));
    expect(screen.getByTestId('report-detail')).toBeInTheDocument();
    await user.click(screen.getByTestId('back-button'));
    expect(screen.getByTestId('reports-feed')).toBeInTheDocument();
  });

  it('filters reports by agent', async () => {
    mockFetchReports();
    const user = userEvent.setup();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByTestId('agent-filter'), 'CFO');
    expect(screen.queryByText('Q1 2026 Market Trends Report')).not.toBeInTheDocument();
    expect(screen.getByText('March 2026 Financial Review')).toBeInTheDocument();
  });

  it('filters reports by date range', async () => {
    mockFetchReports();
    const user = userEvent.setup();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    // Set date-from to 2026-04-05 which should exclude the CFO report (2026-04-01)
    const fromInput = screen.getByTestId('date-from');
    await user.clear(fromInput);
    await user.type(fromInput, '2026-04-05');
    expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    expect(screen.queryByText('March 2026 Financial Review')).not.toBeInTheDocument();
  });

  it('shows clear filters button when filters are active', async () => {
    mockFetchReports();
    const user = userEvent.setup();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('clear-filters')).not.toBeInTheDocument();
    await user.selectOptions(screen.getByTestId('agent-filter'), 'CFO');
    expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
  });

  it('clears filters when Clear filters is clicked', async () => {
    mockFetchReports();
    const user = userEvent.setup();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    await user.selectOptions(screen.getByTestId('agent-filter'), 'CFO');
    expect(screen.queryByText('Q1 2026 Market Trends Report')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('clear-filters'));
    expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    expect(screen.getByText('March 2026 Financial Review')).toBeInTheDocument();
  });

  it('shows "No reports match" when filters exclude all reports', async () => {
    mockFetchReports();
    const user = userEvent.setup();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    // Set a date range that excludes all reports
    const fromInput = screen.getByTestId('date-from');
    await user.clear(fromInput);
    await user.type(fromInput, '2027-01-01');
    expect(screen.getByText('No reports match the current filters.')).toBeInTheDocument();
  });

  it('marks reports as unread by default', async () => {
    mockFetchReports();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('unread-indicator')).toHaveLength(2);
  });

  it('marks report as read after clicking Read more', async () => {
    mockFetchReports();
    const user = userEvent.setup();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    expect(screen.getAllByTestId('unread-indicator')).toHaveLength(2);
    await user.click(screen.getByTestId('read-more-market-trends-q1-2026.md'));
    // Go back to feed
    await user.click(screen.getByTestId('back-button'));
    // Only the CFO report should now have the unread indicator
    expect(screen.getAllByTestId('unread-indicator')).toHaveLength(1);
  });

  it('persists read status across renders', async () => {
    mockFetchReports();
    const user = userEvent.setup();

    const { unmount } = render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('read-more-market-trends-q1-2026.md'));
    unmount();

    // Re-render — read status should persist from localStorage
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });
    // Only the CFO report should have the unread indicator
    expect(screen.getAllByTestId('unread-indicator')).toHaveLength(1);
  });

  it('displays the reports-feed data-testid', async () => {
    mockFetchReports();
    render(<ReportsFeed />);
    await waitFor(() => {
      expect(screen.getByTestId('reports-feed')).toBeInTheDocument();
    });
  });
});
