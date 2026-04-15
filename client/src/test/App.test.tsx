import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { Agent } from '../types';

// Mock EventSource for useSSE hook
class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  readyState = 0;
  url = '';
  withCredentials = false;
  CONNECTING = 0;
  OPEN = 1;
  CLOSED = 2;
  dispatchEvent = vi.fn(() => true);
  onopen: ((event: Event) => void) | null = null;
}

beforeAll(() => {
  (globalThis as Record<string, unknown>).EventSource = MockEventSource;
});

afterAll(() => {
  delete (globalThis as Record<string, unknown>).EventSource;
});

const mockAgents: Agent[] = [
  {
    id: 'market-researcher',
    name: 'Market Researcher',
    role: 'Competitive intelligence, market trends, and TAM/SAM analysis',
    schedule: 'Weekly (Mondays 8am)',
    lastRunTime: '2026-04-11T08:00:00.000Z',
  },
  {
    id: 'cfo',
    name: 'CFO',
    role: 'Revenue modeling, cost tracking, and financial scenario planning',
    schedule: 'Weekly (Mondays 8am)',
    lastRunTime: '2026-04-11T08:00:00.000Z',
  },
  {
    id: 'partnerships-scout',
    name: 'Partnerships Scout',
    role: 'Distribution, integration, and co-marketing opportunity identification',
    schedule: 'On-demand',
    lastRunTime: null,
  },
];

function mockFetchSuccess() {
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url === '/reports') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (url === '/inbox') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    }
    if (url.match(/\/agents\/[^/]+\/memory/)) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ content: '# Memory' }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockAgents),
    });
  });
}

function mockFetchError() {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
  });
}

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(screen.getByText('Loading agents...')).toBeInTheDocument();
  });

  it('renders agents in the sidebar after loading', async () => {
    mockFetchSuccess();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Market Researcher')).toBeInTheDocument();
    });
    expect(screen.getByText('CFO')).toBeInTheDocument();
    expect(screen.getByText('Partnerships Scout')).toBeInTheDocument();
  });

  it('shows the reports feed by default', async () => {
    mockFetchSuccess();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('reports-feed')).toBeInTheDocument();
    });
  });

  it('shows agent detail when an agent is clicked', async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Market Researcher')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('agent-card-market-researcher'));
    expect(screen.getByTestId('agent-detail')).toBeInTheDocument();
    expect(screen.queryByTestId('reports-feed')).not.toBeInTheDocument();
  });

  it('shows error message on fetch failure', async () => {
    mockFetchError();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Error: HTTP 500/)).toBeInTheDocument();
    });
  });

  it('fetches from /agents endpoint', async () => {
    mockFetchSuccess();
    render(<App />);
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/agents');
    });
  });

  it('triggers agent run and updates status to running', async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Market Researcher')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('run-button-market-researcher'));

    // Verify POST was made to /agents/:id/run
    expect(globalThis.fetch).toHaveBeenCalledWith('/agents/market-researcher/run', { method: 'POST' });

    // Status badge should show "running"
    await waitFor(() => {
      const badge = screen.getByTestId('agent-card-market-researcher').querySelector('[data-testid="status-badge"]');
      expect(badge).toHaveTextContent('running');
    });
  });

  it('resets agent status to idle on run failure', async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Market Researcher')).toBeInTheDocument();
    });

    // Override fetch to fail on the run endpoint
    const originalMock = globalThis.fetch;
    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes('/run') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          status: 502,
          json: () => Promise.resolve({ error: 'Routines API returned an error' }),
        });
      }
      return (originalMock as (...args: unknown[]) => unknown)(url, opts);
    });

    await user.click(screen.getByTestId('run-button-market-researcher'));

    // After the failed request, status should revert to idle
    await waitFor(() => {
      const badge = screen.getByTestId('agent-card-market-researcher').querySelector('[data-testid="status-badge"]');
      expect(badge).toHaveTextContent('idle');
    });
  });
});
