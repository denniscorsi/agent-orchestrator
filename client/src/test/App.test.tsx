import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import type { Agent } from '../types';

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
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(mockAgents),
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
});
