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
  it('renders brand, nav, and the routed page content', () => {
    renderLayout('/');
    expect(screen.getByText('DailyBites')).toBeInTheDocument();
    expect(screen.getByText('Admin console')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Admin navigation' })).toBeInTheDocument();
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('shows the correct page title in the topbar based on current route', () => {
    renderLayout('/restaurants');
    expect(screen.getByRole('heading', { name: 'Restaurants' })).toBeInTheDocument();
    expect(screen.getByText('Restaurants Content')).toBeInTheDocument();
  });

  it('toggles theme label when the theme button is clicked', async () => {
    renderLayout('/');
    const toggleButton = screen.getByText('Light mode');
    await userEvent.click(toggleButton);
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('renders a logout control', () => {
    renderLayout('/');
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});