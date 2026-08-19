import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi, formatCurrency } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

type RestaurantDetail = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  category: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostcode: string | null;
  contactNumber: string | null;
  businessLegalName: string | null;
  nzbn: string | null;
  gstNumber: string | null;
  users: { email: string; createdAt: string };
  schedules: { dayOfWeek: number; enabled: boolean; startTime: string; endTime: string }[];
  bags: {
    id: string;
    size: string;
    category: string;
    displayValue: string;
    sellingPrice: string | number;
    quantity: number;
    quantityRemaining: number;
    isActive: boolean;
  }[];
  _count: { orders: number };
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function RestaurantDetail() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [nextStatus, setNextStatus] = useState<'APPROVED' | 'SUSPENDED'>('APPROVED');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.getRestaurant(id);
      setRestaurant(res.data);
    } catch {
      setError('Unable to load restaurant');
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirmStatusChange() {
    if (!id) return;
    setBusy(true);
    setActionError('');
    try {
      await adminApi.updateRestaurantStatus(id, nextStatus);
      setShowModal(false);
      await load();
    } catch {
      setActionError('Failed to update status');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="muted-copy">Loading restaurant…</p>;
  if (error || !restaurant) return <p className="error">{error || 'Restaurant not found'}</p>;

  return (
    <section className="dashboard-stack">
      <header className="dashboard-toolbar">
        <div>
          <p className="eyebrow">
            <Link className="text-link" to="/restaurants">
              Restaurants
            </Link>{' '}
            / Detail
          </p>
          <h2>{restaurant.name}</h2>
        </div>
        <div className="action-row">
          {restaurant.status !== 'APPROVED' ? (
            <button
              type="button"
              onClick={() => {
                setNextStatus('APPROVED');
                setShowModal(true);
              }}
            >
              Approve
            </button>
          ) : null}
          {restaurant.status !== 'SUSPENDED' ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setNextStatus('SUSPENDED');
                setShowModal(true);
              }}
            >
              Suspend
            </button>
          ) : null}
        </div>
      </header>

      {actionError ? <p className="error">{actionError}</p> : null}

      <div className="detail-grid">
        <article className="panel">
          <div className="panel-head">
            <h3>Profile</h3>
            <StatusBadge status={restaurant.status} />
          </div>
          <dl className="detail-list">
            <div>
              <dt>Owner email</dt>
              <dd>{restaurant.users.email}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{restaurant.category.replace(/_/g, ' ')}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{restaurant.description || '—'}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>
                {[restaurant.addressStreet, restaurant.addressCity, restaurant.addressPostcode]
                  .filter(Boolean)
                  .join(', ') || '—'}
              </dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{restaurant.contactNumber || '—'}</dd>
            </div>
            <div>
              <dt>Business</dt>
              <dd>{restaurant.businessLegalName || '—'}</dd>
            </div>
            <div>
              <dt>NZBN</dt>
              <dd>{restaurant.nzbn || '—'}</dd>
            </div>
            <div>
              <dt>GST</dt>
              <dd>{restaurant.gstNumber || '—'}</dd>
            </div>
            <div>
              <dt>Total orders</dt>
              <dd>{restaurant._count.orders}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <div className="panel-head">
            <h3>Weekly schedule</h3>
          </div>
          <ul className="schedule-list">
            {restaurant.schedules.length === 0 ? (
              <li className="muted-copy">No schedule configured</li>
            ) : (
              restaurant.schedules.map((slot) => (
                <li key={slot.dayOfWeek}>
                  <span>{DAYS[slot.dayOfWeek] ?? slot.dayOfWeek}</span>
                  <span>
                    {slot.enabled ? `${slot.startTime} – ${slot.endTime}` : 'Closed'}
                  </span>
                </li>
              ))
            )}
          </ul>
        </article>

        <article className="panel wide-panel">
          <div className="panel-head">
            <h3>Bags</h3>
            <span>{restaurant.bags.length} configured</span>
          </div>
          {restaurant.bags.length === 0 ? (
            <p className="muted-copy">No bags yet</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Category</th>
                  <th>Value</th>
                  <th>Price</th>
                  <th>Qty left</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {restaurant.bags.map((bag) => (
                  <tr key={bag.id}>
                    <td>{bag.size}</td>
                    <td>{bag.category.replace(/_/g, ' ')}</td>
                    <td>{bag.displayValue}</td>
                    <td>{formatCurrency(Number(bag.sellingPrice))}</td>
                    <td>
                      {bag.quantityRemaining}/{bag.quantity}
                    </td>
                    <td>{bag.isActive ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </div>

      {showModal ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowModal(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{nextStatus === 'APPROVED' ? 'Approve restaurant' : 'Suspend restaurant'}</h3>
            <p>
              Set <strong>{restaurant.name}</strong> to{' '}
              <StatusBadge status={nextStatus} />?
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={confirmStatusChange}>
                {busy ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
