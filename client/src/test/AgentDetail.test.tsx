import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentDetail from '../components/AgentDetail';
import type { Agent, Report, InboxMessage } from '../types';

const mockAgent: Agent = {
  id: 'market-researcher',
  name: 'Market Researcher',
  role: 'Competitive intelligence, market trends, and TAM/SAM analysis',
  schedule: 'Weekly (Mondays 8am)',
  lastRunTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'idle',
};

const mockReports: Report[] = [
  {
    filename: 'market-trends-q1-2026.md',
    title: 'Q1 2026 Market Trends Report',
    agent: 'Market Researcher',
    date: '2026-04-07',
    summary: 'The tokenized real-world asset market grew 34%.',
    content: '# Q1 2026 Market Trends Report\n\nFull content here.',
  },
  {
    filename: 'financial-review-march-2026.md',
    title: 'March 2026 Financial Review',
    agent: 'CFO',
    date: '2026-04-01',
    summary: 'March revenue came in at $142K.',
    content: '# March 2026 Financial Review\n\nFull content.',
  },
];

const mockMessages: InboxMessage[] = [
  {
    to: 'Market Researcher',
    from: 'CFO',
    date: '2026-04-10',
    subject: 'RWA Market Data',
    body: 'Please send the latest RWA data.',
    archived: false,
  },
  {
    to: 'CFO',
    from: 'Market Researcher',
    date: '2026-04-11',
    subject: 'Re: RWA Market Data',
    body: 'Here is the latest data.',
    archived: false,
  },
  {
    to: 'Dennis',
    from: 'CFO',
    date: '2026-04-12',
    subject: 'Budget Update',
    body: 'The budget is on track.',
    archived: false,
  },
];

const mockMemoryContent = '# Market Researcher Memory\n\n- Key insight one\n- Key insight two';

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

function mockFetchAll() {
  globalThis.fetch = vi.fn().mockImplementation((url: string) => {
    if (url === '/reports') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockReports),
      });
    }
    if (url === '/inbox') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      });
    }
    if (url.match(/\/agents\/[^/]+\/memory/)) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ content: mockMemoryContent }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });
}

describe('AgentDetail', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows "Agent not found" when agent is undefined', () => {
    mockFetchAll();
    render(<AgentDetail agent={undefined} onBack={() => {}} onCompose={() => {}} />);
    expect(screen.getByText('Agent not found.')).toBeInTheDocument();
  });

  it('renders agent name, role, and schedule', async () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);
    expect(screen.getByText('Market Researcher')).toBeInTheDocument();
    expect(screen.getByText('Competitive intelligence, market trends, and TAM/SAM analysis')).toBeInTheDocument();
    expect(screen.getByTestId('agent-schedule')).toHaveTextContent('Schedule: Weekly (Mondays 8am)');
  });

  it('renders last run time using relativeTime', async () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);
    expect(screen.getByTestId('agent-last-run')).toHaveTextContent('Last run: 3 days ago');
  });

  it('renders "Never" for agents that have never run', async () => {
    mockFetchAll();
    const neverRunAgent = { ...mockAgent, lastRunTime: null };
    render(<AgentDetail agent={neverRunAgent} onBack={() => {}} onCompose={() => {}} />);
    expect(screen.getByTestId('agent-last-run')).toHaveTextContent('Last run: Never');
  });

  it('applies agent accent color to the name', () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);
    const nameEl = screen.getByText('Market Researcher');
    expect(nameEl.className).toContain('text-agent-blue');
  });

  it('fetches and renders memory markdown', async () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('memory-markdown')).toBeInTheDocument();
    });

    expect(screen.getByText('Market Researcher Memory')).toBeInTheDocument();
    expect(screen.getByText('Key insight one')).toBeInTheDocument();
    expect(screen.getByText('Key insight two')).toBeInTheDocument();
  });

  it('shows loading state for memory', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);
    expect(screen.getByText('Loading memory...')).toBeInTheDocument();
  });

  it('shows memory error state', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.match(/\/agents\/[^/]+\/memory/)) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Error: HTTP 500')).toBeInTheDocument();
    });
  });

  it('shows "No memory available" when memory is empty', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.match(/\/agents\/[^/]+\/memory/)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: '' }),
        });
      }
      if (url === '/reports') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url === '/inbox') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No memory available.')).toBeInTheDocument();
    });
  });

  it('filters and displays only this agent\'s reports', async () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });

    // Should NOT show the CFO report
    expect(screen.queryByText('March 2026 Financial Review')).not.toBeInTheDocument();
  });

  it('shows reports section heading with agent name', async () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Reports by Market Researcher')).toBeInTheDocument();
    });
  });

  it('shows empty state when agent has no reports', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/reports') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url === '/inbox') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.match(/\/agents\/[^/]+\/memory/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: 'test' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No reports from this agent yet.')).toBeInTheDocument();
    });
  });

  it('tracks read status on reports', async () => {
    mockFetchAll();
    const user = userEvent.setup();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });

    // Should show unread indicator initially
    expect(screen.getByTestId('unread-indicator')).toBeInTheDocument();

    // Click "Read more" to mark as read
    await user.click(screen.getByTestId('read-more-market-trends-q1-2026.md'));

    // Should show report detail
    expect(screen.getByTestId('report-detail')).toBeInTheDocument();

    // Go back
    await user.click(screen.getByTestId('back-button'));

    // Should no longer show unread indicator
    expect(screen.queryByTestId('unread-indicator')).not.toBeInTheDocument();
  });

  it('filters and displays messages involving this agent', async () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('RWA Market Data')).toBeInTheDocument();
    });

    // Messages to or from Market Researcher should show
    expect(screen.getByText('Re: RWA Market Data')).toBeInTheDocument();

    // Messages not involving Market Researcher should not show
    expect(screen.queryByText('Budget Update')).not.toBeInTheDocument();
  });

  it('shows empty state when agent has no messages', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url === '/reports') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url === '/inbox') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.match(/\/agents\/[^/]+\/memory/)) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ content: 'test' }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('No messages for this agent yet.')).toBeInTheDocument();
    });
  });

  it('calls onCompose with agent id when send message button is clicked', async () => {
    mockFetchAll();
    const user = userEvent.setup();
    const handleCompose = vi.fn();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={handleCompose} />);

    await user.click(screen.getByTestId('send-message-button'));
    expect(handleCompose).toHaveBeenCalledWith('market-researcher');
  });

  it('calls onBack when back button is clicked', async () => {
    mockFetchAll();
    const user = userEvent.setup();
    const handleBack = vi.fn();
    render(<AgentDetail agent={mockAgent} onBack={handleBack} onCompose={() => {}} />);

    await user.click(screen.getByTestId('back-button'));
    expect(handleBack).toHaveBeenCalledOnce();
  });

  it('renders the agent-detail data-testid', () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);
    expect(screen.getByTestId('agent-detail')).toBeInTheDocument();
  });

  it('fetches memory from correct endpoint', async () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/agents/market-researcher/memory');
    });
  });

  it('shows report detail when Read more is clicked and returns on back', async () => {
    mockFetchAll();
    const user = userEvent.setup();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('read-more-market-trends-q1-2026.md'));

    // Report detail should be shown
    expect(screen.getByTestId('report-detail')).toBeInTheDocument();
    expect(screen.queryByTestId('agent-detail')).not.toBeInTheDocument();

    // Click back to return to agent detail
    await user.click(screen.getByTestId('back-button'));
    expect(screen.getByTestId('agent-detail')).toBeInTheDocument();
  });

  it('renders memory section with accent border', async () => {
    mockFetchAll();
    render(<AgentDetail agent={mockAgent} onBack={() => {}} onCompose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('memory-markdown')).toBeInTheDocument();
    });

    const memorySection = screen.getByText('Memory').closest('div');
    expect(memorySection?.className).toContain('border-agent-blue');
  });
});
