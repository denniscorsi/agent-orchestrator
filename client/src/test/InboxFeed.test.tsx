import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InboxFeed from '../components/InboxFeed';
import type { InboxMessage } from '../types';

const mockMessages: InboxMessage[] = [
  {
    to: 'CFO',
    from: 'Market Researcher',
    date: '2026-04-10',
    subject: 'RWA Market Data',
    body: 'Here is the latest market data for your models.',
    archived: false,
  },
  {
    to: 'Dennis',
    from: 'CFO',
    date: '2026-04-12',
    subject: 'March Numbers Summary',
    body: 'March closed at $142K revenue, above forecast.',
    archived: false,
  },
  {
    to: 'CFO',
    from: 'Dennis',
    date: '2026-04-13',
    subject: 'Budget Review Request',
    body: 'Please prepare the Q2 budget review.\nInclude projections for GPU costs.\nAlso add the new hiring plan.\nAnd the updated revenue forecast.\nFinally, include the cash flow analysis.',
    archived: false,
  },
  {
    to: 'Market Researcher',
    from: 'CFO',
    date: '2026-04-08',
    subject: 'Old Request',
    body: 'Archived message content.',
    archived: true,
  },
];

function mockFetch(messages: InboxMessage[]) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(messages),
  });
}

describe('InboxFeed', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the inbox heading', async () => {
    mockFetch([]);
    render(<InboxFeed />);
    expect(screen.getByText('Inbox')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
    render(<InboxFeed />);
    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    render(<InboxFeed />);
    expect(await screen.findByText('Error: HTTP 500')).toBeInTheDocument();
  });

  it('shows empty state when no messages', async () => {
    mockFetch([]);
    render(<InboxFeed />);
    expect(await screen.findByText('No messages yet.')).toBeInTheDocument();
  });

  it('renders message cards with subject, from, to, and date', async () => {
    mockFetch(mockMessages);
    render(<InboxFeed />);

    expect(await screen.findByText('RWA Market Data')).toBeInTheDocument();
    expect(screen.getByText('March Numbers Summary')).toBeInTheDocument();
    expect(screen.getByText('Budget Review Request')).toBeInTheDocument();
  });

  it('shows Dennis badge for messages from Dennis', async () => {
    mockFetch(mockMessages);
    render(<InboxFeed />);

    await screen.findByText('Budget Review Request');
    const badges = screen.getAllByTestId('dennis-badge');
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent('Dennis');
  });

  it('shows archived badge for archived messages', async () => {
    mockFetch(mockMessages);
    render(<InboxFeed />);

    await screen.findByText('Old Request');
    const badges = screen.getAllByTestId('archived-badge');
    expect(badges).toHaveLength(1);
    expect(badges[0]).toHaveTextContent('Archived');
  });

  it('expands message body on "Read full message" click', async () => {
    const longBodyMessage: InboxMessage = {
      to: 'CFO',
      from: 'Dennis',
      date: '2026-04-13',
      subject: 'Long Message',
      body: 'Line one of the message.\nLine two of the message.\nLine three of the message.\nLine four should be hidden initially.\nLine five should also be hidden.',
      archived: false,
    };
    mockFetch([longBodyMessage]);
    render(<InboxFeed />);

    await screen.findByText('Long Message');
    const expandBtn = screen.getByTestId('toggle-expand');
    expect(expandBtn).toHaveTextContent('Read full message');

    // Body preview should show only 3 lines
    expect(screen.queryByText(/Line four/)).not.toBeInTheDocument();

    await userEvent.click(expandBtn);

    // Now the full body should be visible
    expect(screen.getByText(/Line four should be hidden initially/)).toBeInTheDocument();
    expect(expandBtn).toHaveTextContent('Show less');
  });

  it('does not show expand button when body fits in preview', async () => {
    const shortMessage: InboxMessage = {
      to: 'CFO',
      from: 'Market Researcher',
      date: '2026-04-10',
      subject: 'Short',
      body: 'Just a short message.',
      archived: false,
    };
    mockFetch([shortMessage]);
    render(<InboxFeed />);

    await screen.findByText('Short');
    expect(screen.queryByTestId('toggle-expand')).not.toBeInTheDocument();
  });

  it('applies distinct styling to archived messages', async () => {
    mockFetch(mockMessages);
    render(<InboxFeed />);

    await screen.findByText('Old Request');
    const cards = screen.getAllByTestId('message-card');
    const archivedCard = cards.find((card) =>
      within(card).queryByText('Old Request')
    );
    expect(archivedCard).toBeDefined();
    expect(archivedCard!.className).toContain('opacity-60');
  });

  it('applies distinct styling to Dennis messages', async () => {
    mockFetch(mockMessages);
    render(<InboxFeed />);

    await screen.findByText('Budget Review Request');
    const cards = screen.getAllByTestId('message-card');
    const dennisCard = cards.find((card) =>
      within(card).queryByText('Budget Review Request')
    );
    expect(dennisCard).toBeDefined();
    expect(dennisCard!.className).toContain('border-purple');
  });
});
