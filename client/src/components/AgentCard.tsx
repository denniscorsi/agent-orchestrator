import type { Agent } from '../types';
import { getAgentColor, accentClasses } from '../agentColors';
import { relativeTime } from '../timeUtils';
import StatusBadge from './StatusBadge';

interface AgentCardProps {
  agent: Agent;
  isActive: boolean;
  onClick: () => void;
  onRun?: (agentId: string) => void;
}

export default function AgentCard({ agent, isActive, onClick, onRun }: AgentCardProps) {
  const color = getAgentColor(agent.id);
  const accent = accentClasses[color];
  const status = agent.status ?? 'idle';

  return (
    <button
      data-testid={`agent-card-${agent.id}`}
      onClick={onClick}
      className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer
        ${isActive ? `${accent.border} ${accent.bg}` : 'border-surface-600 hover:border-surface-600 hover:bg-surface-700'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className={`text-sm font-semibold ${accent.text}`}>{agent.name}</h3>
        <StatusBadge status={status} />
      </div>
      <p className="mt-1 text-xs text-gray-400 line-clamp-1">{agent.role}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{agent.schedule}</span>
        <span>{relativeTime(agent.lastRunTime)}</span>
      </div>
      <div className="mt-2 flex justify-end">
        <span
          role="button"
          tabIndex={0}
          data-testid={`run-button-${agent.id}`}
          onClick={(e) => { e.stopPropagation(); if (status !== 'running' && onRun) onRun(agent.id); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); if (status !== 'running' && onRun) onRun(agent.id); } }}
          aria-disabled={status === 'running'}
          className={`text-xs px-2 py-0.5 rounded transition-colors ${
            status === 'running'
              ? 'text-gray-500 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-200 hover:bg-surface-600 cursor-pointer'
          }`}
        >
          {status === 'running' ? 'Running\u2026' : 'Run now'}
        </span>
      </div>
    </button>
  );
}
