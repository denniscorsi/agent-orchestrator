import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportDetail from '../components/ReportDetail';
import type { Report } from '../types';

const mockReport: Report = {
  filename: 'market-trends-q1-2026.md',
  title: 'Q1 2026 Market Trends Report',
  agent: 'Market Researcher',
  date: '2026-04-07',
  summary: 'The tokenized real-world asset market grew 34%.',
  content: [
    '# Q1 2026 Market Trends Report',
    '',
    '**Author:** Market Researcher',
    '**Date:** 2026-04-07',
    '',
    '---',
    '',
    'The market grew **significantly** this quarter.',
    '',
    '## Key Findings',
    '',
    '- Finding one',
    '- Finding two',
  ].join('\n'),
};

describe('ReportDetail', () => {
  it('renders the report agent and date', () => {
    render(<ReportDetail report={mockReport} onBack={() => {}} />);
    expect(screen.getByText('Market Researcher')).toBeInTheDocument();
    expect(screen.getByText('2026-04-07')).toBeInTheDocument();
  });

  it('renders the back button', () => {
    render(<ReportDetail report={mockReport} onBack={() => {}} />);
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    const handleBack = vi.fn();
    render(<ReportDetail report={mockReport} onBack={handleBack} />);
    await user.click(screen.getByTestId('back-button'));
    expect(handleBack).toHaveBeenCalledOnce();
  });

  it('renders markdown content', () => {
    render(<ReportDetail report={mockReport} onBack={() => {}} />);
    expect(screen.getByTestId('report-markdown')).toBeInTheDocument();
    // Markdown should render the H1 heading
    expect(screen.getByText('Q1 2026 Market Trends Report')).toBeInTheDocument();
    // Markdown should render the H2 heading
    expect(screen.getByText('Key Findings')).toBeInTheDocument();
  });

  it('renders bold text from markdown', () => {
    render(<ReportDetail report={mockReport} onBack={() => {}} />);
    const strong = screen.getByText('significantly');
    expect(strong.tagName).toBe('STRONG');
  });

  it('renders list items from markdown', () => {
    render(<ReportDetail report={mockReport} onBack={() => {}} />);
    expect(screen.getByText('Finding one')).toBeInTheDocument();
    expect(screen.getByText('Finding two')).toBeInTheDocument();
  });

  it('applies correct agent color', () => {
    render(<ReportDetail report={mockReport} onBack={() => {}} />);
    const agentEl = screen.getByText('Market Researcher');
    expect(agentEl.className).toContain('text-agent-blue');
  });
});
