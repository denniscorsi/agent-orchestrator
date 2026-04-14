import { useState } from 'react';
import { useAgents } from './useAgents';
import Sidebar from './components/Sidebar';
import type { View } from './components/Sidebar';
import AgentDetail from './components/AgentDetail';
import ReportsFeed from './components/ReportsFeed';
import InboxFeed from './components/InboxFeed';
import MessageComposer from './components/MessageComposer';

function App() {
  const { agents, loading, error } = useAgents();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('reports');
  const [composerOpen, setComposerOpen] = useState(false);
  const [inboxKey, setInboxKey] = useState(0);

  const activeAgent = agents.find((a) => a.id === activeAgentId);

  function handleSelectView(view: View) {
    setActiveView(view);
    setActiveAgentId(null);
  }

  function handleMessageSent() {
    setInboxKey((k) => k + 1);
  }

  function mainContent() {
    if (activeAgentId) return <AgentDetail agent={activeAgent} />;
    if (activeView === 'inbox') return <InboxFeed key={inboxKey} />;
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
        onCompose={() => setComposerOpen(true)}
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

      <MessageComposer
        agents={agents}
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSent={handleMessageSent}
      />
    </div>
  );
}

export default App;
