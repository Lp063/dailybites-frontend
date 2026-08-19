import Chip from '@mui/material/Chip';
import type { ChipProps } from '@mui/material/Chip';

type StatusBadgeProps = {
  status: string;
};

const tone: Record<string, ChipProps['color']> = {
  PENDING: 'warning',
  APPROVED: 'success',
  SUSPENDED: 'error',
  TRIAL: 'info',
  PAID: 'success',
  COLLECTED: 'success',
  CANCELLED: 'error',
  MISSED: 'warning',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const color = tone[status] ?? 'default';
  return <Chip label={status.replace(/_/g, ' ')} color={color} size="small" />;
}