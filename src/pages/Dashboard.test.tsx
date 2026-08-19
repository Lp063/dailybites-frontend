import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Dashboard } from './Dashboard';
import { ThemeProvider } from '../context/ThemeContext';
import { adminApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  adminApi: { stats: vi.fn() },
  formatCurrency: (value: number | null | undefined) =>
    value == null || Number.isNaN(value) ? '—' : `$${Number(value).toFixed(2)}`,
}));

beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 600 });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 300 });
});

function renderDashboard() {
  return render(
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}

const mockStats = {
  restaurants: 12,
  activeUsers: 340,
  pendingApprovals: 3,
  revenueToday: 512.4,
  ordersToday: 28,
  avgOrderValue: 18.3,
  statusBreakdown: [
    { status: 'PAID', count: 20 },
    { status: 'PENDING', count: 5 },
  ],
  dailyRevenue: [
    { date: '2026-08-18', revenue: 300 },
    { date: '2026-08-19', revenue: 450 },
  ],
};

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stat cards with values from the API', async () => {
    (adminApi.stats as any).mockResolvedValueOnce({ data: mockStats });
    renderDashboard();

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
  });

  it('shows an error message when stats fail to load', async () => {
    (adminApi.stats as any).mockRejectedValueOnce(new Error('network error'));
    renderDashboard();

    expect(await screen.findByText('Unable to load dashboard stats')).toBeInTheDocument();
  });

  it('renders empty states when there is no revenue or status data', async () => {
    (adminApi.stats as any).mockResolvedValueOnce({
      data: { ...mockStats, dailyRevenue: [], statusBreakdown: [] },
    });
    renderDashboard();

    expect(await screen.findByText('No revenue data yet')).toBeInTheDocument();
    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
  });

  it('toggles theme from the dashboard toolbar', async () => {
    (adminApi.stats as any).mockResolvedValueOnce({ data: mockStats });
    renderDashboard();
    await screen.findByText('12');

    await userEvent.click(screen.getByText('Light mode'));
    expect(await screen.findByText('Dark mode')).toBeInTheDocument();
  });
});