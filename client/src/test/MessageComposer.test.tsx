import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageComposer from '../components/MessageComposer';
import type { Agent } from '../types';

const mockAgents: Agent[] = [
  { id: 'market-researcher', name: 'Market Researcher', role: 'Research', schedule: 'Weekly', lastRunTime: null },
  { id: 'cfo', name: 'CFO', role: 'Finance', schedule: 'Weekly', lastRunTime: null },
  { id: 'partnerships-scout', name: 'Partnerships Scout', role: 'Partnerships', schedule: 'On-demand', lastRunTime: null },
];

describe('MessageComposer', () => {
  let onClose: () => void;
  let onSent: () => void;

  beforeEach(() => {
    onClose = vi.fn();
    onSent = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    render(<MessageComposer agents={mockAgents} open={false} onClose={onClose} onSent={onSent} />);
    expect(screen.queryByTestId('composer-drawer')).not.toBeInTheDocument();
  });

  it('renders the drawer when open', () => {
    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);
    expect(screen.getByTestId('composer-drawer')).toBeInTheDocument();
    expect(screen.getByText('New message')).toBeInTheDocument();
  });

  it('shows all agents in the To dropdown', () => {
    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);
    const select = screen.getByTestId('composer-to');
    expect(select).toBeInTheDocument();
    expect(select).toHaveTextContent('Select recipient...');
    expect(select).toHaveTextContent('All agents');
    expect(select).toHaveTextContent('Market Researcher');
    expect(select).toHaveTextContent('CFO');
    expect(select).toHaveTextContent('Partnerships Scout');
  });

  it('calls onClose when close button is clicked', async () => {
    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);
    await userEvent.click(screen.getByTestId('composer-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking the backdrop', async () => {
    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);
    await userEvent.click(screen.getByTestId('composer-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the drawer', async () => {
    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);
    await userEvent.click(screen.getByTestId('composer-drawer'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows validation error when fields are empty', async () => {
    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);
    await userEvent.click(screen.getByTestId('composer-send'));
    expect(screen.getByTestId('composer-error')).toHaveTextContent('All fields are required.');
  });

  it('sends a message and calls onSent + onClose', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ to: 'CFO', from: 'Dennis', date: '2026-04-14', subject: 'Test', body: 'Hello', archived: false }]),
    });

    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);

    await userEvent.selectOptions(screen.getByTestId('composer-to'), 'cfo');
    await userEvent.type(screen.getByTestId('composer-subject'), 'Test Subject');
    await userEvent.type(screen.getByTestId('composer-message'), 'Hello there.');
    await userEvent.click(screen.getByTestId('composer-send'));

    await waitFor(() => {
      expect(onSent).toHaveBeenCalled();
    });
    expect(onClose).toHaveBeenCalled();

    expect(globalThis.fetch).toHaveBeenCalledWith('/inbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'cfo', subject: 'Test Subject', message: 'Hello there.' }),
    });
  });

  it('shows error when API returns an error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);

    await userEvent.selectOptions(screen.getByTestId('composer-to'), 'cfo');
    await userEvent.type(screen.getByTestId('composer-subject'), 'Test');
    await userEvent.type(screen.getByTestId('composer-message'), 'Body');
    await userEvent.click(screen.getByTestId('composer-send'));

    await waitFor(() => {
      expect(screen.getByTestId('composer-error')).toHaveTextContent('Server error');
    });
    expect(onSent).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables send button while sending', async () => {
    globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);

    await userEvent.selectOptions(screen.getByTestId('composer-to'), 'cfo');
    await userEvent.type(screen.getByTestId('composer-subject'), 'Test');
    await userEvent.type(screen.getByTestId('composer-message'), 'Body');
    await userEvent.click(screen.getByTestId('composer-send'));

    expect(screen.getByTestId('composer-send')).toBeDisabled();
    expect(screen.getByTestId('composer-send')).toHaveTextContent('Sending...');
  });

  it('supports broadcast to all agents', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} />);

    await userEvent.selectOptions(screen.getByTestId('composer-to'), 'all');
    await userEvent.type(screen.getByTestId('composer-subject'), 'Team Update');
    await userEvent.type(screen.getByTestId('composer-message'), 'Hello everyone.');
    await userEvent.click(screen.getByTestId('composer-send'));

    await waitFor(() => {
      expect(onSent).toHaveBeenCalled();
    });

    expect(globalThis.fetch).toHaveBeenCalledWith('/inbox', expect.objectContaining({
      body: JSON.stringify({ to: 'all', subject: 'Team Update', message: 'Hello everyone.' }),
    }));
  });

  it('pre-fills the To field when prefillTo is provided', () => {
    render(<MessageComposer agents={mockAgents} open={true} onClose={onClose} onSent={onSent} prefillTo="cfo" />);
    expect(screen.getByTestId('composer-to')).toHaveValue('cfo');
  });
});
