import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './AppLayout';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';

function renderLayout(initialPath = '/') {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<div>Dashboard Content</div>} />
              <Route path="/restaurants" element={<div>Restaurants Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    sessionStorage.clear();
  });

  it('renders collapsed by default: nav and content visible, labels hidden', () => {
    renderLayout('/');
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Admin navigation' })).toBeInTheDocument();

    // Labels are not rendered while collapsed — only icons (with tooltips) show
    expect(screen.queryByText('DailyBites')).not.toBeInTheDocument();
    expect(screen.queryByText('Restaurants')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('expands and reveals labels on hover, then collapses again on mouse leave', async () => {
    renderLayout('/');
    const nav = screen.getByRole('navigation', { name: 'Admin navigation' });

    await userEvent.hover(nav);
    expect(await screen.findByText('DailyBites')).toBeInTheDocument();
    expect(screen.getByText('Restaurants')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();

    await userEvent.unhover(nav);
    expect(screen.queryByText('DailyBites')).not.toBeInTheDocument();
    expect(screen.queryByText('Restaurants')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows the correct page title in the topbar based on current route', () => {
    renderLayout('/restaurants');
    expect(screen.getByRole('heading', { name: 'Restaurants' })).toBeInTheDocument();
    expect(screen.getByText('Restaurants Content')).toBeInTheDocument();
  });

  it('toggles theme via the sidebar control (the only theme toggle)', async () => {
    renderLayout('/');
    const nav = screen.getByRole('navigation', { name: 'Admin navigation' });
    await userEvent.hover(nav);

    // Default theme is light, so the sidebar offers to switch to dark
    const toggleButton = await screen.findByText('Dark mode');
    await userEvent.click(toggleButton);

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(await screen.findByText('Light mode')).toBeInTheDocument();
  });

  it('calls logout and clears the stored token when Logout is clicked', async () => {
    sessionStorage.setItem('admin_token', 'fake-token');
    renderLayout('/');
    const nav = screen.getByRole('navigation', { name: 'Admin navigation' });
    await userEvent.hover(nav);

    const logoutButton = await screen.findByText('Logout');
    await userEvent.click(logoutButton);

    expect(sessionStorage.getItem('admin_token')).toBeNull();
  });
});