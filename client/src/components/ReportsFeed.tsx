import { useState, useMemo } from 'react';
import type { Report } from '../types';
import { useReports } from '../useReports';
import { useReadStatus } from '../useReadStatus';
import ReportCard from './ReportCard';
import ReportDetail from './ReportDetail';

export default function ReportsFeed() {
  const { reports, loading, error } = useReports();
  const { isRead, markRead } = useReadStatus();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const uniqueAgents = useMemo(() => {
    const names = [...new Set(reports.map((r) => r.agent))];
    names.sort();
    return names;
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (agentFilter && r.agent !== agentFilter) return false;
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  }, [reports, agentFilter, dateFrom, dateTo]);

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
    <div data-testid="reports-feed" className="p-8">
      <h2 className="text-2xl font-bold text-gray-100">Reports</h2>
      <p className="mt-1 text-sm text-gray-400">
        Recent reports from your agents.
      </p>

      {/* Filters */}
      <div data-testid="report-filters" className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="agent-filter" className="block text-xs text-gray-500 mb-1">
            Agent
          </label>
          <select
            id="agent-filter"
            data-testid="agent-filter"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="rounded border border-surface-600 bg-surface-800 px-3 py-1.5 text-sm text-gray-200"
          >
            <option value="">All agents</option>
            {uniqueAgents.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date-from" className="block text-xs text-gray-500 mb-1">
            From
          </label>
          <input
            id="date-from"
            data-testid="date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded border border-surface-600 bg-surface-800 px-3 py-1.5 text-sm text-gray-200"
          />
        </div>

        <div>
          <label htmlFor="date-to" className="block text-xs text-gray-500 mb-1">
            To
          </label>
          <input
            id="date-to"
            data-testid="date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded border border-surface-600 bg-surface-800 px-3 py-1.5 text-sm text-gray-200"
          />
        </div>

        {(agentFilter || dateFrom || dateTo) && (
          <button
            data-testid="clear-filters"
            onClick={() => { setAgentFilter(''); setDateFrom(''); setDateTo(''); }}
            className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-6 space-y-4">
        {loading && (
          <p className="text-gray-500">Loading reports...</p>
        )}

        {error && (
          <p className="text-red-400">Error: {error}</p>
        )}

        {!loading && !error && filteredReports.length === 0 && (
          <div className="rounded-lg border border-surface-600 bg-surface-700 p-6">
            <p className="text-sm text-gray-500">
              {reports.length === 0
                ? 'No reports yet.'
                : 'No reports match the current filters.'}
            </p>
          </div>
        )}

        {filteredReports.map((report) => (
          <ReportCard
            key={report.filename}
            report={report}
            isUnread={!isRead(report.filename)}
            onReadMore={() => handleReadMore(report)}
          />
        ))}
      </div>
    </div>
  );
}
