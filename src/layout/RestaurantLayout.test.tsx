import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RestaurantLayout from './RestaurantLayout';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

function renderRestaurantLayout() {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={['/restaurant']}>
          <Routes>
            <Route element={<RestaurantLayout />}>
              <Route path="/restaurant" element={<div>Restaurant Home Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

describe('RestaurantLayout', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders the partner portal heading, subtitle, logout button, and routed content', () => {
    renderRestaurantLayout();

    expect(
      screen.getByRole('heading', { name: 'DailyBites Partner Portal' })
    ).toBeInTheDocument();
    expect(screen.getByText('Restaurant management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
    expect(screen.getByText('Restaurant Home Content')).toBeInTheDocument();
  });

  it('clears stored access and refresh tokens when Logout is clicked', async () => {
    sessionStorage.setItem('admin_token', 'restaurant-access-token');
    sessionStorage.setItem('admin_refresh_token', 'restaurant-refresh-token');

    renderRestaurantLayout();

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

    expect(sessionStorage.getItem('admin_token')).toBeNull();
    expect(sessionStorage.getItem('admin_refresh_token')).toBeNull();
  });
});