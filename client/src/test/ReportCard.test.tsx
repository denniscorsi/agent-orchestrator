import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportCard from '../components/ReportCard';
import type { Report } from '../types';

const mockReport: Report = {
  filename: 'market-trends-q1-2026.md',
  title: 'Q1 2026 Market Trends Report',
  agent: 'Market Researcher',
  date: '2026-04-07',
  summary: 'The tokenized real-world asset market grew 34% quarter-over-quarter.',
  content: '# Q1 2026 Market Trends Report\n\nFull content here.',
};

describe('ReportCard', () => {
  it('renders report title', () => {
    render(<ReportCard report={mockReport} isUnread={false} onReadMore={() => {}} />);
    expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
  });

  it('renders agent name with color', () => {
    render(<ReportCard report={mockReport} isUnread={false} onReadMore={() => {}} />);
    const agentEl = screen.getByText('Market Researcher');
    expect(agentEl).toBeInTheDocument();
    expect(agentEl.className).toContain('text-agent-blue');
  });

  it('renders report date', () => {
    render(<ReportCard report={mockReport} isUnread={false} onReadMore={() => {}} />);
    expect(screen.getByText('2026-04-07')).toBeInTheDocument();
  });

  it('renders report summary', () => {
    render(<ReportCard report={mockReport} isUnread={false} onReadMore={() => {}} />);
    expect(screen.getByText(/tokenized real-world asset market grew 34%/)).toBeInTheDocument();
  });

  it('shows unread indicator when isUnread is true', () => {
    render(<ReportCard report={mockReport} isUnread={true} onReadMore={() => {}} />);
    expect(screen.getByTestId('unread-indicator')).toBeInTheDocument();
  });

  it('hides unread indicator when isUnread is false', () => {
    render(<ReportCard report={mockReport} isUnread={false} onReadMore={() => {}} />);
    expect(screen.queryByTestId('unread-indicator')).not.toBeInTheDocument();
  });

  it('calls onReadMore when "Read more" is clicked', async () => {
    const user = userEvent.setup();
    const handleReadMore = vi.fn();
    render(<ReportCard report={mockReport} isUnread={false} onReadMore={handleReadMore} />);
    await user.click(screen.getByTestId(`read-more-${mockReport.filename}`));
    expect(handleReadMore).toHaveBeenCalledOnce();
  });

  it('applies correct color for CFO agent', () => {
    const cfoReport = { ...mockReport, agent: 'CFO' };
    render(<ReportCard report={cfoReport} isUnread={false} onReadMore={() => {}} />);
    const agentEl = screen.getByText('CFO');
    expect(agentEl.className).toContain('text-agent-amber');
  });

  it('renders the Read more button', () => {
    render(<ReportCard report={mockReport} isUnread={false} onReadMore={() => {}} />);
    expect(screen.getByText('Read more')).toBeInTheDocument();
  });
});
