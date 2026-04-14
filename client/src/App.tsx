import { useState } from 'react';
import { useAgents } from './useAgents';
import Sidebar from './components/Sidebar';
import type { View } from './components/Sidebar';
import AgentDetail from './components/AgentDetail';
import ReportsFeed from './components/ReportsFeed';
import InboxFeed from './components/InboxFeed';

function App() {
  const { agents, loading, error } = useAgents();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('reports');

  const activeAgent = agents.find((a) => a.id === activeAgentId);

  function handleSelectView(view: View) {
    setActiveView(view);
    setActiveAgentId(null);
  }

  function mainContent() {
    if (activeAgentId) return <AgentDetail agent={activeAgent} />;
    if (activeView === 'inbox') return <InboxFeed />;
    return <ReportsFeed />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        agents={agents}
        activeAgentId={activeAgentId}
        activeView={activeView}
        onSelectAgent={setActiveAgentId}
        onSelectView={handleSelectView}
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

        {!loading && !error && mainContent()}
      </main>
    </div>
  );
}

export default App;
