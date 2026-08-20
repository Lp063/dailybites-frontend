import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import UsersPage from './Users';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));


const listResponse = (items: any[]) => ({
  data: {
    success: true,
    data: { items, pagination: { page: 1, limit: 20, total: items.length, totalPages: 1 } },
  },
});

const sampleUsers = [
  {
    id: 'u1',
    email: 'cafe@dailybites.com',
    role: 'RESTAURANT',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    restaurant: { name: 'Green Bowl', status: 'APPROVED', category: 'MEALS', contactNumber: '021000000', addressCity: 'Wellington' },
    sessionCount: 2,
  },
  {
    id: 'u2',
    email: 'jane@example.com',
    role: 'CUSTOMER',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-04T00:00:00.000Z',
    customer: { firstName: 'Jane', lastName: 'Doe', phoneNumber: '0211234567', addressCity: 'Auckland' },
    sessionCount: 1,
  },
];

describe('admin/Users', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue(listResponse(sampleUsers));
  });

  it('renders users from the API', async () => {
    render(<UsersPage />);
    expect(await screen.findByText('cafe@dailybites.com')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Green Bowl')).toBeInTheDocument();
  });

  it('creates a new user via the Add user dialog', async () => {
    (api.post as any).mockResolvedValueOnce({ data: { success: true } });
    render(<UsersPage />);
    await screen.findByText('cafe@dailybites.com');

    const callsBeforeSubmit = (api.get as any).mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: 'Add user' }));
    expect(await screen.findByRole('heading', { name: 'Add user' })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^email/i), 'new.customer@example.com');
    await userEvent.type(screen.getByLabelText(/^password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    expect(api.post).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({ email: 'new.customer@example.com', role: 'CUSTOMER' })
    );
    expect((api.get as any).mock.calls.length).toBeGreaterThan(callsBeforeSubmit);
  });

  it('shows a validation error when creating without a password', async () => {
    render(<UsersPage />);
    await screen.findByText('cafe@dailybites.com');

    await userEvent.click(screen.getByRole('button', { name: 'Add user' }));
    await userEvent.type(screen.getByLabelText(/^email/i), 'no.password@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('edits an existing user via the Edit dialog', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: { success: true } });
    render(<UsersPage />);
    await screen.findByText('jane@example.com');

    const row = screen.getByText('jane@example.com').closest('tr')!;
    await userEvent.click(within(row).getByLabelText('edit'));

    expect(await screen.findByRole('heading', { name: 'Edit user' })).toBeInTheDocument();
    const emailInput = screen.getByLabelText(/^email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('jane@example.com');

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(api.patch).toHaveBeenCalledWith(
      '/users/u2',
      expect.objectContaining({ email: 'jane@example.com', role: 'CUSTOMER' })
    );
  });

  it('opens the view dialog with read-only details', async () => {
    render(<UsersPage />);
    await screen.findByText('cafe@dailybites.com');

    const row = screen.getByText('cafe@dailybites.com').closest('tr')!;
    await userEvent.click(within(row).getByLabelText('view'));

    expect(await screen.findByRole('heading', { name: 'User details' })).toBeInTheDocument();
    expect(screen.getByText(/Restaurant name:/)).toBeInTheDocument();
    expect(screen.getByText('Wellington')).toBeInTheDocument();
  });

  it('deletes a user after confirming in the dialog', async () => {
    (api.delete as any).mockResolvedValueOnce({ data: { success: true } });
    render(<UsersPage />);
    await screen.findByText('jane@example.com');

    const row = screen.getByText('jane@example.com').closest('tr')!;
    await userEvent.click(within(row).getByLabelText('delete'));

    expect(await screen.findByRole('heading', { name: 'Delete user' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(api.delete).toHaveBeenCalledWith('/users/u2');
  });

  it('does not delete when cancel is clicked', async () => {
    render(<UsersPage />);
    await screen.findByText('jane@example.com');

    const row = screen.getByText('jane@example.com').closest('tr')!;
    await userEvent.click(within(row).getByLabelText('delete'));
    await screen.findByRole('heading', { name: 'Delete user' });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(api.delete).not.toHaveBeenCalled();
  });

  it('sends a password reset link', async () => {
    (api.post as any).mockResolvedValueOnce({ data: { success: true } });
    render(<UsersPage />);
    await screen.findByText('jane@example.com');

    const row = screen.getByText('jane@example.com').closest('tr')!;
    await userEvent.click(within(row).getByLabelText('reset email'));
    await screen.findByRole('heading', { name: 'Send password reset' });
    await userEvent.click(screen.getByRole('button', { name: 'Send link' }));

    expect(api.post).toHaveBeenCalledWith('/users/u2/send-password-reset');
  });
});