type StatusBadgeProps = {
  status: string;
};

const tone: Record<string, string> = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  SUSPENDED: 'badge-suspended',
  TRIAL: 'badge-trial',
  PAID: 'badge-approved',
  COLLECTED: 'badge-approved',
  CANCELLED: 'badge-suspended',
  MISSED: 'badge-pending',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const className = tone[status] ?? 'badge-default';
  return <span className={`status-badge ${className}`}>{status.replace(/_/g, ' ')}</span>;
}
