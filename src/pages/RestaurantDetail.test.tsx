import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { RestaurantDetail } from './RestaurantDetail';
import { adminApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  adminApi: { getRestaurant: vi.fn(), updateRestaurantStatus: vi.fn() },
  formatCurrency: (value: number | null | undefined) =>
    value == null || Number.isNaN(value) ? '—' : `$${Number(value).toFixed(2)}`,
}));

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/restaurants/r1']}>
      <Routes>
        <Route path="/restaurants/:id" element={<RestaurantDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

const baseRestaurant = {
  id: 'r1',
  name: 'Green Bowl',
  description: 'Healthy bowls',
  status: 'PENDING',
  category: 'CAFE',
  addressStreet: '1 Main St',
  addressCity: 'Wellington',
  addressPostcode: '6011',
  contactNumber: '021123456',
  businessLegalName: 'Green Bowl Ltd',
  nzbn: '123456789',
  gstNumber: 'GST-1',
  users: { email: 'owner@greenbowl.com', createdAt: '2026-01-01' },
  schedules: [{ dayOfWeek: 1, enabled: true, startTime: '09:00', endTime: '17:00' }],
  bags: [
    {
      id: 'b1',
      size: 'MEDIUM',
      category: 'MEAL',
      displayValue: 'Surprise bag',
      sellingPrice: '9.99',
      quantity: 5,
      quantityRemaining: 3,
      isActive: true,
    },
  ],
  count: { orders: 42 },
};

describe('RestaurantDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders restaurant profile, schedule, and bags', async () => {
    (adminApi.getRestaurant as any).mockResolvedValueOnce({ data: baseRestaurant });
    renderDetail();

    expect(await screen.findByRole('heading', { name: 'Green Bowl' })).toBeInTheDocument();
    expect(screen.getByText('owner@greenbowl.com')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('09:00 - 17:00')).toBeInTheDocument();
    expect(screen.getByText('Surprise bag')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('shows an error state when the restaurant fails to load', async () => {
    (adminApi.getRestaurant as any).mockRejectedValueOnce(new Error('network error'));
    renderDetail();

    expect(await screen.findByText('Unable to load restaurant')).toBeInTheDocument();
  });

  it('approves a restaurant after confirming in the dialog', async () => {
    (adminApi.getRestaurant as any).mockResolvedValueOnce({ data: baseRestaurant });
    (adminApi.updateRestaurantStatus as any).mockResolvedValueOnce({});
    (adminApi.getRestaurant as any).mockResolvedValueOnce({
      data: { ...baseRestaurant, status: 'APPROVED' },
    });

    renderDetail();
    await screen.findByRole('heading', { name: 'Green Bowl' });

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByRole('heading', { name: 'Approve restaurant' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(adminApi.updateRestaurantStatus).toHaveBeenCalledWith('r1', 'APPROVED');
    await screen.findByRole('button', { name: 'Suspend' });
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument();
  });

  it('suspends a restaurant after confirming in the dialog', async () => {
    (adminApi.getRestaurant as any).mockResolvedValueOnce({
      data: { ...baseRestaurant, status: 'APPROVED' },
    });
    (adminApi.updateRestaurantStatus as any).mockResolvedValueOnce({});
    (adminApi.getRestaurant as any).mockResolvedValueOnce({
      data: { ...baseRestaurant, status: 'SUSPENDED' },
    });

    renderDetail();
    await screen.findByRole('heading', { name: 'Green Bowl' });

    await userEvent.click(screen.getByRole('button', { name: 'Suspend' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(adminApi.updateRestaurantStatus).toHaveBeenCalledWith('r1', 'SUSPENDED');
  });

  it('closes the dialog without updating when cancel is clicked', async () => {
    (adminApi.getRestaurant as any).mockResolvedValueOnce({ data: baseRestaurant });
    renderDetail();
    await screen.findByRole('heading', { name: 'Green Bowl' });

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await screen.findByRole('heading', { name: 'Approve restaurant' });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(adminApi.updateRestaurantStatus).not.toHaveBeenCalled();
  });

  it('shows an action error when the status update fails', async () => {
    (adminApi.getRestaurant as any).mockResolvedValueOnce({ data: baseRestaurant });
    (adminApi.updateRestaurantStatus as any).mockRejectedValueOnce(new Error('failed'));

    renderDetail();
    await screen.findByRole('heading', { name: 'Green Bowl' });

    await userEvent.click(screen.getByRole('button', { name: 'Approve' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText('Failed to update status')).toBeInTheDocument();
  });
});