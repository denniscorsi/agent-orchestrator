import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Report } from '../types';
import { getAgentColor, accentClasses } from '../agentColors';

interface ReportDetailProps {
  report: Report;
  onBack: () => void;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function ReportDetail({ report, onBack }: ReportDetailProps) {
  const agentSlug = slugify(report.agent);
  const color = getAgentColor(agentSlug);
  const accent = accentClasses[color];

  return (
    <div data-testid="report-detail" className="p-8">
      <button
        data-testid="back-button"
        onClick={onBack}
        className="mb-4 text-sm text-gray-400 hover:text-gray-200 cursor-pointer"
      >
        &larr; Back to reports
      </button>

      <div className="mb-2 flex items-center gap-3 text-sm">
        <span className={`font-medium ${accent.text}`}>{report.agent}</span>
        <span className="text-gray-500">{report.date}</span>
      </div>

      <div
        data-testid="report-markdown"
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
        <Markdown remarkPlugins={[remarkGfm]}>{report.content}</Markdown>
      </div>
    </div>
  );
}
