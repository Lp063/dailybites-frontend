import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import { Login } from './Login';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { authApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  authApi: { login: vi.fn() },
  setTokens: vi.fn(),
}));

function renderLogin() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<div>Dashboard Landing</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('Login', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: 'Admin Login' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('logs in successfully as ADMIN and navigates to dashboard', async () => {
    (authApi.login as any).mockResolvedValueOnce({
      success: true,
      data: { user: { role: 'ADMIN' }, accessToken: 'tok-123', refreshToken: 'refresh-123' },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@dailybites.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Dashboard Landing')).toBeInTheDocument();
  });

  it('rejects non-admin roles with an error message', async () => {
    (authApi.login as any).mockResolvedValueOnce({
      success: true,
      data: { user: { role: 'RESTAURANT' }, accessToken: 'tok-456', refreshToken: 'refresh-456' },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'cafe@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Admin access required')).toBeInTheDocument();
  });

  it('shows an error message when the API call fails', async () => {
    (authApi.login as any).mockRejectedValueOnce(new Error('Invalid email or password'));

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('disables the submit button and shows loading text while submitting', async () => {
    let resolveLogin: (value: any) => void;
    (authApi.login as any).mockImplementationOnce(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@dailybites.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeDisabled();
    resolveLogin!({
      success: true,
      data: { user: { role: 'ADMIN' }, accessToken: 'tok-789', refreshToken: 'refresh-789' },
    });
    await screen.findByText('Dashboard Landing');
  });

  it('toggles the theme when the theme button is clicked', async () => {
    renderLogin();
    const toggleButton = screen.getByLabelText('Toggle theme');
    const initialTheme = document.documentElement.dataset.theme;
    await userEvent.click(toggleButton);
    expect(document.documentElement.dataset.theme).not.toBe(initialTheme);
  });
});