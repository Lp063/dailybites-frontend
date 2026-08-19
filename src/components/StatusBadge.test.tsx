import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders APPROVED status with success color and spaced label', () => {
    render(<StatusBadge status="APPROVED" />);
    const chip = screen.getByText('APPROVED');
    expect(chip).toBeInTheDocument();
    expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
  });

  it('renders PENDING status with warning color', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByText('PENDING').closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
  });

  it('renders SUSPENDED status with error color', () => {
    render(<StatusBadge status="SUSPENDED" />);
    expect(screen.getByText('SUSPENDED').closest('.MuiChip-root')).toHaveClass('MuiChip-colorError');
  });

  it('replaces underscores with spaces in the label', () => {
    render(<StatusBadge status="BREAD_PASTRIES" />);
    expect(screen.getByText('BREAD PASTRIES')).toBeInTheDocument();
  });

  it('falls back to default color for unmapped status', () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText('UNKNOWN STATUS').closest('.MuiChip-root')).toHaveClass('MuiChip-colorDefault');
  });
});