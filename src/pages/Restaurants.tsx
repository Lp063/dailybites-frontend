import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, RestaurantListItem } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'SUSPENDED', 'TRIAL'] as const;

export function Restaurants() {
  const [items, setItems] = useState<RestaurantListItem[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('ALL');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.listRestaurants({
        page,
        search: query || undefined,
        status: status === 'ALL' ? undefined : status,
      });
      setItems(res.data.items);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch {
      setError('Unable to load restaurants');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    load();
  }, [load]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  }

  return (
    <section className="dashboard-stack">
      <header className="dashboard-toolbar">
        <div>
          <p className="eyebrow">Operations</p>
          <h2>Restaurants</h2>
        </div>
      </header>

      <div className="toolbar-row">
        <form className="search-form" onSubmit={onSearch}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, city, or email"
          />
          <button type="submit">Search</button>
        </form>

        <div className="filter-row">
          {STATUS_FILTERS.map((value) => (
            <button
              key={value}
              type="button"
              className={`filter-chip ${status === value ? 'active' : ''}`}
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {value.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="panel wide-panel table-panel">
        {loading ? (
          <p className="muted-copy">Loading restaurants…</p>
        ) : items.length === 0 ? (
          <p className="muted-copy">No restaurants found</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>City</th>
                <th>Owner</th>
                <th>Bags</th>
                <th>Orders</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <span className="table-sub">{row.category.replace(/_/g, ' ')}</span>
                  </td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                  <td>{row.addressCity ?? '—'}</td>
                  <td>{row.ownerEmail}</td>
                  <td>{row.bagCount}</td>
                  <td>{row.orderCount}</td>
                  <td>
                    <Link className="text-link" to={`/restaurants/${row.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}
