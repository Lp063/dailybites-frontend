import { useEffect, useMemo, useState } from 'react';
import { adminApi, formatCurrency } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { useTheme } from '../context/ThemeContext';

export function Dashboard() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof adminApi.stats>>['data'] | null>(null);
  const [error, setError] = useState('');
  const { theme, toggle } = useTheme();

  useEffect(() => {
    let mounted = true;

    adminApi
      .stats()
      .then((res) => {
        if (!mounted) return;
        setStats(res.data ?? null);
      })
      .catch(() => {
        if (!mounted) return;
        setError('Unable to load dashboard stats');
        setStats(null);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const cards = useMemo(
    () => [
      { label: 'Restaurants', value: stats?.restaurants ?? '—', hint: 'Approved restaurants' },
      { label: 'Active users', value: stats?.activeUsers ?? '—', hint: 'Updated in the last 30 days' },
      { label: 'Pending approvals', value: stats?.pendingApprovals ?? '—', hint: 'Requires admin review' },
      { label: 'Revenue today', value: formatCurrency(stats?.revenueToday), hint: 'Current day gross sales' },
      { label: 'Orders today', value: stats?.ordersToday ?? '—', hint: 'Paid, ready, or collected' },
      { label: 'Avg order value', value: formatCurrency(stats?.avgOrderValue), hint: 'Average basket size today' },
    ],
    [stats]
  );

  const maxRevenue = Math.max(...(stats?.dailyRevenue.map((d) => d.revenue) ?? [1]), 1);

  return (
    <section className="dashboard-stack">
      <header className="dashboard-toolbar">
        <div>
          <p className="eyebrow">Dashboard / KPIs</p>
          <h2>Admin overview</h2>
        </div>
        <button type="button" className="theme-toggle inline-toggle" onClick={toggle}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <section className="kpi-grid">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel wide-panel">
          <div className="panel-head">
            <h3>Revenue trend</h3>
            <span>Last 30 days</span>
          </div>
          <div className="chart-bars">
            {(stats?.dailyRevenue ?? []).length === 0 ? (
              <p className="muted-copy">No revenue data yet</p>
            ) : (
              stats?.dailyRevenue.map((point) => (
                <div className="chart-bar-row" key={point.date}>
                  <span className="chart-bar-label">{point.date.slice(5)}</span>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{ width: `${Math.max((point.revenue / maxRevenue) * 100, 4)}%` }}
                    />
                  </div>
                  <span className="chart-bar-value">{formatCurrency(point.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>Status mix</h3>
            <span>Orders · 30 days</span>
          </div>
          <ul className="status-list">
            {(stats?.statusBreakdown ?? []).length === 0 ? (
              <li className="muted-copy">No orders yet</li>
            ) : (
              stats?.statusBreakdown.map((row) => (
                <li key={row.status}>
                  <span>{row.status.replace(/_/g, ' ')}</span>
                  <strong>{row.count}</strong>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>
    </section>
  );
}
