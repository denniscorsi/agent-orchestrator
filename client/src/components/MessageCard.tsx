import { useState } from 'react';
import type { InboxMessage } from '../types';

interface MessageCardProps {
  message: InboxMessage;
}

function isFromDennis(from: string): boolean {
  return from.toLowerCase() === 'dennis';
}

function getBodyPreview(body: string): string {
  const lines = body.split('\n').filter((l) => l.trim().length > 0);
  return lines.slice(0, 3).join('\n');
}

export default function MessageCard({ message }: MessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const fromDennis = isFromDennis(message.from);
  const preview = getBodyPreview(message.body);
  const hasMore = preview.length < message.body.trim().length;

  return (
    <div
      data-testid={`message-card`}
      className={`rounded-lg border p-5 ${
        message.archived
          ? 'border-surface-600 bg-surface-700/50 opacity-60'
          : fromDennis
            ? 'border-purple-400/40 bg-surface-700'
            : 'border-surface-600 bg-surface-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-gray-100">
              {message.subject}
            </h3>
            {fromDennis && (
              <span
                data-testid="dennis-badge"
                className="shrink-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300"
              >
                Dennis
              </span>
            )}
            {message.archived && (
              <span
                data-testid="archived-badge"
                className="shrink-0 rounded-full bg-surface-600 px-2 py-0.5 text-xs font-medium text-gray-500"
              >
                Archived
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm">
            <span className="text-gray-400">
              <span className="text-gray-500">From:</span>{' '}
              <span className={fromDennis ? 'font-medium text-purple-300' : 'text-gray-300'}>
                {message.from}
              </span>
            </span>
            <span className="text-gray-400">
              <span className="text-gray-500">To:</span>{' '}
              <span className="text-gray-300">{message.to}</span>
            </span>
            <span className="text-gray-500">{message.date}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm leading-relaxed text-gray-400 whitespace-pre-line">
        {expanded ? message.body : preview}
      </div>

      {hasMore && (
        <button
          data-testid="toggle-expand"
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm font-medium text-agent-blue hover:underline cursor-pointer"
        >
          {expanded ? 'Show less' : 'Read full message'}
        </button>
      )}
    </div>
  );
}
