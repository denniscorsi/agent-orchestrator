interface StatusBadgeProps {
  status: 'idle' | 'running' | 'needs attention';
}

const styles: Record<string, string> = {
  idle: 'bg-gray-600/30 text-gray-400',
  running: 'bg-green-500/20 text-green-400',
  'needs attention': 'bg-red-500/20 text-red-400',
};

const dots: Record<string, string> = {
  idle: 'bg-gray-400',
  running: 'bg-green-400 animate-pulse',
  'needs attention': 'bg-red-400',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}
