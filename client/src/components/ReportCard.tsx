import type { Report } from '../types';
import { getAgentColor, accentClasses } from '../agentColors';

interface ReportCardProps {
  report: Report;
  isUnread: boolean;
  onReadMore: () => void;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function ReportCard({ report, isUnread, onReadMore }: ReportCardProps) {
  const agentSlug = slugify(report.agent);
  const color = getAgentColor(agentSlug);
  const accent = accentClasses[color];

  return (
    <div
      data-testid={`report-card-${report.filename}`}
      className={`rounded-lg border p-5 ${accent.border} bg-surface-700`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isUnread && (
              <span
                data-testid="unread-indicator"
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${accent.text.replace('text-', 'bg-')}`}
              />
            )}
            <h3 className="truncate text-lg font-semibold text-gray-100">
              {report.title}
            </h3>
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className={`font-medium ${accent.text}`}>{report.agent}</span>
            <span className="text-gray-500">{report.date}</span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-gray-400 line-clamp-3">
        {report.summary}
      </p>

      <button
        data-testid={`read-more-${report.filename}`}
        onClick={onReadMore}
        className={`mt-4 text-sm font-medium ${accent.text} hover:underline cursor-pointer`}
      >
        Read more
      </button>
    </div>
  );
}
