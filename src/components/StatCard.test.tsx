import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders label, value, and hint', () => {
    render(<StatCard label="Restaurants" value={12} hint="Approved restaurants" />);
    expect(screen.getByText('Restaurants')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Approved restaurants')).toBeInTheDocument();
  });

  it('renders string values correctly', () => {
    render(<StatCard label="Revenue today" value="$458.90" hint="Current day gross sales" />);
    expect(screen.getByText('$458.90')).toBeInTheDocument();
  });
});