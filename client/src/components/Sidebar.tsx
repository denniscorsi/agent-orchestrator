import type { Agent } from '../types';
import AgentCard from './AgentCard';

interface SidebarProps {
  agents: Agent[];
  activeAgentId: string | null;
  onSelectAgent: (id: string) => void;
}

export default function Sidebar({ agents, activeAgentId, onSelectAgent }: SidebarProps) {
  return (
    <aside
      data-testid="sidebar"
      className="flex w-64 shrink-0 flex-col border-r border-surface-600 bg-surface-800"
    >
      <div className="flex items-center gap-2 border-b border-surface-600 px-4 py-4">
        <h1 className="text-base font-bold tracking-tight text-gray-100">Tether</h1>
        <span className="text-xs text-gray-500">Agent Dashboard</span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isActive={agent.id === activeAgentId}
            onClick={() => onSelectAgent(agent.id)}
          />
        ))}
      </nav>
    </aside>
  );
}
