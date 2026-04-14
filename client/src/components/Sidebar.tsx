import type { Agent } from '../types';
import AgentCard from './AgentCard';

export type View = 'reports' | 'inbox';

interface SidebarProps {
  agents: Agent[];
  activeAgentId: string | null;
  activeView: View;
  onSelectAgent: (id: string) => void;
  onSelectView: (view: View) => void;
}

export default function Sidebar({ agents, activeAgentId, activeView, onSelectAgent, onSelectView }: SidebarProps) {
  return (
    <aside
      data-testid="sidebar"
      className="flex w-64 shrink-0 flex-col border-r border-surface-600 bg-surface-800"
    >
      <div className="flex items-center gap-2 border-b border-surface-600 px-4 py-4">
        <h1 className="text-base font-bold tracking-tight text-gray-100">Tether</h1>
        <span className="text-xs text-gray-500">Agent Dashboard</span>
      </div>

      <div data-testid="nav-tabs" className="flex border-b border-surface-600">
        <button
          data-testid="nav-reports"
          onClick={() => onSelectView('reports')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium cursor-pointer ${
            activeView === 'reports' && !activeAgentId
              ? 'text-gray-100 border-b-2 border-agent-blue'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Reports
        </button>
        <button
          data-testid="nav-inbox"
          onClick={() => onSelectView('inbox')}
          className={`flex-1 px-4 py-2.5 text-sm font-medium cursor-pointer ${
            activeView === 'inbox' && !activeAgentId
              ? 'text-gray-100 border-b-2 border-agent-blue'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Inbox
        </button>
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
