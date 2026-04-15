import { useState } from 'react';
import { useAgents } from './useAgents';
import { useSSE } from './useSSE';
import Sidebar from './components/Sidebar';
import type { View } from './components/Sidebar';
import AgentDetail from './components/AgentDetail';
import ReportsFeed from './components/ReportsFeed';
import InboxFeed from './components/InboxFeed';
import MessageComposer from './components/MessageComposer';

function App() {
  const { agents, loading, error, setAgentStatus } = useAgents();
  const {
    newReportCount,
    newMessageCount,
    clearReportBadge,
    clearMessageBadge,
    reportRefreshKey,
    messageRefreshKey,
  } = useSSE();
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('reports');
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerPrefillTo, setComposerPrefillTo] = useState<string | undefined>(undefined);
  const [inboxKey, setInboxKey] = useState(0);

  const activeAgent = agents.find((a) => a.id === activeAgentId);

  function handleSelectView(view: View) {
    setActiveView(view);
    setActiveAgentId(null);
    if (view === 'reports') clearReportBadge();
    if (view === 'inbox') clearMessageBadge();
  }

  function handleMessageSent() {
    setInboxKey((k) => k + 1);
  }

  function handleComposeFromAgent(prefillTo: string) {
    setComposerPrefillTo(prefillTo);
    setComposerOpen(true);
  }

  function handleCloseComposer() {
    setComposerOpen(false);
    setComposerPrefillTo(undefined);
  }

  async function handleRunAgent(agentId: string) {
    setAgentStatus(agentId, 'running');
    try {
      const res = await fetch(`/agents/${agentId}/run`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      // Log the session URL for debugging — eventually could link to it in the UI.
      if (data?.sessionUrl) {
        console.log(`Routine triggered: ${data.sessionUrl}`);
      }
      // Keep running status — the agent is now running in the background.
      // Reset to idle after a timeout since we don't have real-time status updates yet.
      setTimeout(() => setAgentStatus(agentId, 'idle'), 30000);
    } catch (err) {
      setAgentStatus(agentId, 'idle');
      console.error('Failed to trigger agent:', err);
    }
  }

  function mainContent() {
    if (activeAgentId) return (
      <AgentDetail
        agent={activeAgent}
        onBack={() => setActiveAgentId(null)}
        onCompose={handleComposeFromAgent}
      />
    );
    if (activeView === 'inbox') return <InboxFeed key={`${inboxKey}-${messageRefreshKey}`} />;
    return <ReportsFeed key={reportRefreshKey} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        agents={agents}
        activeAgentId={activeAgentId}
        activeView={activeView}
        newReportCount={newReportCount}
        newMessageCount={newMessageCount}
        onSelectAgent={setActiveAgentId}
        onSelectView={handleSelectView}
        onCompose={() => { setComposerPrefillTo(undefined); setComposerOpen(true); }}
        onRunAgent={handleRunAgent}
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
        key={composerPrefillTo ?? 'composer'}
        agents={agents}
        open={composerOpen}
        onClose={handleCloseComposer}
        onSent={handleMessageSent}
        prefillTo={composerPrefillTo}
      />
    </div>
  );
}

export default App;
