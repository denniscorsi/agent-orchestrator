import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AgentCard from '../components/AgentCard';
import type { Agent } from '../types';

const mockAgent: Agent = {
  id: 'market-researcher',
  name: 'Market Researcher',
  role: 'Competitive intelligence, market trends',
  schedule: 'Weekly (Mondays 8am)',
  lastRunTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'idle',
};

describe('AgentCard', () => {
  it('renders agent name and role', () => {
    render(<AgentCard agent={mockAgent} isActive={false} onClick={() => {}} />);
    expect(screen.getByText('Market Researcher')).toBeInTheDocument();
    expect(screen.getByText('Competitive intelligence, market trends')).toBeInTheDocument();
  });

  it('renders agent schedule', () => {
    render(<AgentCard agent={mockAgent} isActive={false} onClick={() => {}} />);
    expect(screen.getByText('Weekly (Mondays 8am)')).toBeInTheDocument();
  });

  it('renders relative last run time', () => {
    render(<AgentCard agent={mockAgent} isActive={false} onClick={() => {}} />);
    expect(screen.getByText('3 days ago')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<AgentCard agent={mockAgent} isActive={false} onClick={() => {}} />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('idle');
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<AgentCard agent={mockAgent} isActive={false} onClick={handleClick} />);
    await user.click(screen.getByTestId('agent-card-market-researcher'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies active styling when isActive is true', () => {
    const { container } = render(<AgentCard agent={mockAgent} isActive={true} onClick={() => {}} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('border-agent-blue');
  });

  it('defaults status to idle when not provided', () => {
    const agentNoStatus = { ...mockAgent, status: undefined };
    render(<AgentCard agent={agentNoStatus} isActive={false} onClick={() => {}} />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('idle');
  });
});
