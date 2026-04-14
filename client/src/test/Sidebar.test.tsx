import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Sidebar from '../components/Sidebar';
import type { Agent } from '../types';

const mockAgents: Agent[] = [
  {
    id: 'market-researcher',
    name: 'Market Researcher',
    role: 'Competitive intelligence',
    schedule: 'Weekly (Mondays 8am)',
    lastRunTime: null,
    status: 'idle',
  },
  {
    id: 'cfo',
    name: 'CFO',
    role: 'Revenue modeling',
    schedule: 'Weekly (Mondays 8am)',
    lastRunTime: null,
    status: 'running',
  },
  {
    id: 'partnerships-scout',
    name: 'Partnerships Scout',
    role: 'Partnership opportunities',
    schedule: 'On-demand',
    lastRunTime: null,
    status: 'needs attention',
  },
];

describe('Sidebar', () => {
  it('renders all three agents', () => {
    render(<Sidebar agents={mockAgents} activeAgentId={null} activeView="reports" onSelectAgent={() => {}} onSelectView={() => {}} onCompose={() => {}} />);
    expect(screen.getByText('Market Researcher')).toBeInTheDocument();
    expect(screen.getByText('CFO')).toBeInTheDocument();
    expect(screen.getByText('Partnerships Scout')).toBeInTheDocument();
  });

  it('renders the Tether branding', () => {
    render(<Sidebar agents={mockAgents} activeAgentId={null} activeView="reports" onSelectAgent={() => {}} onSelectView={() => {}} onCompose={() => {}} />);
    expect(screen.getByText('Tether')).toBeInTheDocument();
    expect(screen.getByText('Agent Dashboard')).toBeInTheDocument();
  });

  it('calls onSelectAgent when an agent card is clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<Sidebar agents={mockAgents} activeAgentId={null} activeView="reports" onSelectAgent={handleSelect} onSelectView={() => {}} onCompose={() => {}} />);
    await user.click(screen.getByTestId('agent-card-cfo'));
    expect(handleSelect).toHaveBeenCalledWith('cfo');
  });

  it('passes activeAgentId to the correct card', () => {
    const { container } = render(
      <Sidebar agents={mockAgents} activeAgentId="cfo" activeView="reports" onSelectAgent={() => {}} onSelectView={() => {}} onCompose={() => {}} />
    );
    const cfoCard = container.querySelector('[data-testid="agent-card-cfo"]');
    expect(cfoCard?.className).toContain('border-agent-amber');
  });

  it('renders an empty sidebar when no agents provided', () => {
    render(<Sidebar agents={[]} activeAgentId={null} activeView="reports" onSelectAgent={() => {}} onSelectView={() => {}} onCompose={() => {}} />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });
});
