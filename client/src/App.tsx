import { useState } from 'react';
import { useAgents } from './useAgents';
import Sidebar from './components/Sidebar';
import AgentDetail from './components/AgentDetail';
import ReportsFeed from './components/ReportsFeed';

function App() {
  const { agents, loading, error } = useAgents();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);

  const activeAgent = agents.find((a) => a.id === activeAgentId);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        agents={agents}
        activeAgentId={activeAgentId}
        onSelectAgent={setActiveAgentId}
      />

      <main className="flex-1 overflow-y-auto bg-surface-900">
        {loading && (
          <div className="flex h-full items-center justify-center text-gray-500">
            Loading agents...
          </div>
        )}

        {error && (
          <div className="flex h-full items-center justify-center text-red-400">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          activeAgentId ? <AgentDetail agent={activeAgent} /> : <ReportsFeed />
        )}
      </main>
    </div>
  );
}

export default App;
