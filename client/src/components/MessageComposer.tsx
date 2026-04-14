import { useState } from 'react';
import type { Agent } from '../types';

interface MessageComposerProps {
  agents: Agent[];
  open: boolean;
  onClose: () => void;
  onSent: () => void;
  prefillTo?: string;
}

export default function MessageComposer({ agents, open, onClose, onSent, prefillTo }: MessageComposerProps) {
  const [to, setTo] = useState(prefillTo ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTo(prefillTo ?? '');
    setSubject('');
    setMessage('');
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSend() {
    if (!to || !subject.trim() || !message.trim()) {
      setError('All fields are required.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch('/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject: subject.trim(), message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      resetForm();
      onSent();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <div data-testid="composer-backdrop" className="fixed inset-0 z-50 flex justify-end" onClick={handleClose}>
      <div
        data-testid="composer-drawer"
        className="flex h-full w-full max-w-md flex-col border-l border-surface-600 bg-surface-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-600 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-100">New message</h2>
          <button
            data-testid="composer-close"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-300 cursor-pointer text-xl leading-none"
            aria-label="Close composer"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {/* To */}
          <div>
            <label htmlFor="composer-to" className="mb-1 block text-sm font-medium text-gray-400">
              To
            </label>
            <select
              id="composer-to"
              data-testid="composer-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-200 focus:border-agent-blue focus:outline-none"
            >
              <option value="">Select recipient...</option>
              <option value="all">All agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="composer-subject" className="mb-1 block text-sm font-medium text-gray-400">
              Subject
            </label>
            <input
              id="composer-subject"
              data-testid="composer-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Re: ..."
              className="w-full rounded-md border border-surface-600 bg-surface-700 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-agent-blue focus:outline-none"
            />
          </div>

          {/* Message */}
          <div className="flex flex-1 flex-col">
            <label htmlFor="composer-message" className="mb-1 block text-sm font-medium text-gray-400">
              Message
            </label>
            <textarea
              id="composer-message"
              data-testid="composer-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              className="w-full flex-1 resize-none rounded-md border border-surface-600 bg-surface-700 px-3 py-2 text-sm leading-relaxed text-gray-200 placeholder-gray-500 focus:border-agent-blue focus:outline-none"
              rows={8}
            />
          </div>

          {/* Error */}
          {error && (
            <p data-testid="composer-error" className="text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-600 px-5 py-4">
          <button
            data-testid="composer-send"
            onClick={handleSend}
            disabled={sending}
            className="w-full rounded-md bg-agent-blue px-4 py-2 text-sm font-semibold text-surface-900 hover:brightness-110 disabled:opacity-50 cursor-pointer"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
