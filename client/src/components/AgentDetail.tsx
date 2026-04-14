import { useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Agent, Report } from '../types';
import { getAgentColor, accentClasses } from '../agentColors';
import { relativeTime } from '../timeUtils';
import { useAgentMemory } from '../useAgentMemory';
import { useReports } from '../useReports';
import { useReadStatus } from '../useReadStatus';
import { useInbox } from '../useInbox';
import ReportCard from './ReportCard';
import ReportDetail from './ReportDetail';
import MessageCard from './MessageCard';

interface AgentDetailProps {
  agent: Agent | undefined;
  onBack: () => void;
  onCompose: (prefillTo: string) => void;
}

export default function AgentDetail({ agent, onBack, onCompose }: AgentDetailProps) {
  const { memory, loading: memoryLoading, error: memoryError } = useAgentMemory(agent?.id);
  const { reports, loading: reportsLoading, error: reportsError } = useReports();
  const { isRead, markRead } = useReadStatus();
  const { messages, loading: messagesLoading, error: messagesError } = useInbox();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const agentReports = useMemo(() => {
    if (!agent) return [];
    return reports.filter((r) => r.agent === agent.name);
  }, [reports, agent]);

  const agentMessages = useMemo(() => {
    if (!agent) return [];
    return messages.filter((m) => m.to === agent.name || m.from === agent.name);
  }, [messages, agent]);

  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Agent not found.
      </div>
    );
  }

  const color = getAgentColor(agent.id);
  const accent = accentClasses[color];

  function handleReadMore(report: Report) {
    markRead(report.filename);
    setSelectedReport(report);
  }

  if (selectedReport) {
    return (
      <ReportDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div data-testid="agent-detail" className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            data-testid="back-button"
            onClick={onBack}
            className="mb-4 text-sm text-gray-400 hover:text-gray-200 cursor-pointer"
          >
            &larr; Back
          </button>
          <h2 className={`text-2xl font-bold ${accent.text}`}>{agent.name}</h2>
          <p className="mt-1 text-gray-400">{agent.role}</p>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
            <span data-testid="agent-schedule">Schedule: {agent.schedule}</span>
            <span data-testid="agent-last-run">Last run: {relativeTime(agent.lastRunTime)}</span>
          </div>
        </div>
        <button
          data-testid="send-message-button"
          onClick={() => onCompose(agent.id)}
          className={`mt-8 rounded-md px-4 py-2 text-sm font-semibold ${accent.bg} ${accent.text} hover:brightness-125 cursor-pointer`}
        >
          Send message
        </button>
      </div>

      {/* Memory section */}
      <div className={`mb-6 rounded-lg border ${accent.border} bg-surface-700 p-6`}>
        <h3 className="mb-3 text-lg font-semibold text-gray-100">Memory</h3>
        {memoryLoading && (
          <p className="text-sm text-gray-500">Loading memory...</p>
        )}
        {memoryError && (
          <p className="text-sm text-red-400">Error: {memoryError}</p>
        )}
        {!memoryLoading && !memoryError && memory && (
          <div
            data-testid="memory-markdown"
            className="prose prose-invert max-w-none
              prose-headings:text-gray-100
              prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4
              prose-h2:text-xl prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3
              prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-li:text-gray-300
              prose-strong:text-gray-200
              prose-a:text-agent-blue prose-a:no-underline hover:prose-a:underline
              prose-table:border-surface-600
              prose-th:border-surface-600 prose-th:text-gray-300 prose-th:p-2
              prose-td:border-surface-600 prose-td:text-gray-400 prose-td:p-2"
          >
            <Markdown remarkPlugins={[remarkGfm]}>{memory}</Markdown>
          </div>
        )}
        {!memoryLoading && !memoryError && !memory && (
          <p className="text-sm text-gray-500">No memory available.</p>
        )}
      </div>

      {/* Reports section */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-100">
          Reports by {agent.name}
        </h3>
        {reportsLoading && (
          <p className="text-sm text-gray-500">Loading reports...</p>
        )}
        {reportsError && (
          <p className="text-sm text-red-400">Error: {reportsError}</p>
        )}
        {!reportsLoading && !reportsError && agentReports.length === 0 && (
          <div className="rounded-lg border border-surface-600 bg-surface-700 p-6">
            <p className="text-sm text-gray-500">No reports from this agent yet.</p>
          </div>
        )}
        <div className="space-y-4">
          {agentReports.map((report) => (
            <ReportCard
              key={report.filename}
              report={report}
              isUnread={!isRead(report.filename)}
              onReadMore={() => handleReadMore(report)}
            />
          ))}
        </div>
      </div>

      {/* Messages section */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-100">Messages</h3>
        {messagesLoading && (
          <p className="text-sm text-gray-500">Loading messages...</p>
        )}
        {messagesError && (
          <p className="text-sm text-red-400">Error: {messagesError}</p>
        )}
        {!messagesLoading && !messagesError && agentMessages.length === 0 && (
          <div className="rounded-lg border border-surface-600 bg-surface-700 p-6">
            <p className="text-sm text-gray-500">No messages for this agent yet.</p>
          </div>
        )}
        <div className="space-y-4">
          {agentMessages.map((message, index) => (
            <MessageCard
              key={`${message.from}-${message.to}-${message.date}-${index}`}
              message={message}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
