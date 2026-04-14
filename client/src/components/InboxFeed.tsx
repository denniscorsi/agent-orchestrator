import { useInbox } from '../useInbox';
import MessageCard from './MessageCard';

export default function InboxFeed() {
  const { messages, loading, error } = useInbox();

  return (
    <div data-testid="inbox-feed" className="p-8">
      <h2 className="text-2xl font-bold text-gray-100">Inbox</h2>
      <p className="mt-1 text-sm text-gray-400">
        Messages between agents and from Dennis.
      </p>

      <div className="mt-6 space-y-4">
        {loading && (
          <p className="text-gray-500">Loading messages...</p>
        )}

        {error && (
          <p className="text-red-400">Error: {error}</p>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="rounded-lg border border-surface-600 bg-surface-700 p-6">
            <p className="text-sm text-gray-500">No messages yet.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <MessageCard key={`${message.from}-${message.to}-${message.date}-${index}`} message={message} />
        ))}
      </div>
    </div>
  );
}
