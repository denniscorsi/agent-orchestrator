import type { Agent } from '../types';
import { getAgentColor, accentClasses } from '../agentColors';

interface AgentDetailProps {
  agent: Agent | undefined;
}

export default function AgentDetail({ agent }: AgentDetailProps) {
  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Agent not found.
      </div>
    );
  }

  const color = getAgentColor(agent.id);
  const accent = accentClasses[color];

  return (
    <div data-testid="agent-detail" className="p-8">
      <h2 className={`text-2xl font-bold ${accent.text}`}>{agent.name}</h2>
      <p className="mt-1 text-gray-400">{agent.role}</p>
      <div className="mt-6 rounded-lg border border-surface-600 bg-surface-700 p-6">
        <p className="text-sm text-gray-500">
          Agent detail view coming soon. This will show run history, memory, and configuration.
        </p>
      </div>
    </div>
  );
}
