import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Restaurants } from './Restaurants';
import { adminApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  adminApi: { listRestaurants: vi.fn() },
}));

function renderRestaurants() {
  return render(
    <MemoryRouter>
      <Restaurants />
    </MemoryRouter>
  );
}

const makeResponse = (items: any[], totalPages = 1) => ({
  data: { items, pagination: { page: 1, limit: 20, total: items.length, totalPages } },
});

const sampleItems = [
  {
    id: 'r1',
    name: 'Green Bowl',
    status: 'APPROVED',
    category: 'CAFE',
    addressCity: 'Wellington',
    email: null,
    ownerEmail: 'owner@greenbowl.com',
    createdAt: '2026-01-01',
    bagCount: 3,
    orderCount: 12,
  },
];

describe('Restaurants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders restaurant rows returned from the API', async () => {
    (adminApi.listRestaurants as any).mockResolvedValueOnce(makeResponse(sampleItems));
    renderRestaurants();

    expect(await screen.findByText('Green Bowl')).toBeInTheDocument();
    expect(screen.getByText('Wellington')).toBeInTheDocument();
    expect(screen.getByText('owner@greenbowl.com')).toBeInTheDocument();
  });

  it('shows an empty state when no restaurants match', async () => {
    (adminApi.listRestaurants as any).mockResolvedValueOnce(makeResponse([]));
    renderRestaurants();

    expect(await screen.findByText('No restaurants found')).toBeInTheDocument();
  });

  it('shows an error message when the load fails', async () => {
    (adminApi.listRestaurants as any).mockRejectedValueOnce(new Error('network error'));
    renderRestaurants();

    expect(await screen.findByText('Unable to load restaurants')).toBeInTheDocument();
  });

  it('searches by typing and submitting', async () => {
    (adminApi.listRestaurants as any).mockResolvedValueOnce(makeResponse(sampleItems));
    renderRestaurants();
    await screen.findByText('Green Bowl');

    (adminApi.listRestaurants as any).mockResolvedValueOnce(makeResponse([]));
    await userEvent.type(screen.getByPlaceholderText('Search name, city, or email'), 'sushi');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    await screen.findByText('No restaurants found');
    expect(adminApi.listRestaurants).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'sushi', page: 1 })
    );
  });

  it('filters by status when a chip is clicked', async () => {
    (adminApi.listRestaurants as any).mockResolvedValueOnce(makeResponse(sampleItems));
    renderRestaurants();
    await screen.findByText('Green Bowl');

    (adminApi.listRestaurants as any).mockResolvedValueOnce(makeResponse([]));
    await userEvent.click(screen.getByText('PENDING'));

    await screen.findByText('No restaurants found');
    expect(adminApi.listRestaurants).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'PENDING', page: 1 })
    );
  });

  it('paginates when a page number is clicked', async () => {
    (adminApi.listRestaurants as any).mockResolvedValueOnce(makeResponse(sampleItems, 3));
    renderRestaurants();
    await screen.findByText('Green Bowl');

    (adminApi.listRestaurants as any).mockResolvedValueOnce(makeResponse(sampleItems, 3));
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }));

    expect(adminApi.listRestaurants).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
  });
});