import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

type UserRole = 'ADMIN' | 'RESTAURANT' | 'CUSTOMER';

function makeToken(role: UserRole) {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ userId: 'test-user-id', email: 'test@example.com', role }));
  return `${header}.${payload}.test-signature`;
}

function renderProtectedRoute(
  allowedRoles?: UserRole[],
  token?: string | null,
  initialPath = '/restaurant'
) {
  sessionStorage.clear();

  if (token) {
    sessionStorage.setItem('admin_token', token);
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/restaurant" element={<div>Restaurant Protected Content</div>} />
            <Route path="/admin" element={<div>Admin Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Landing</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('redirects an unauthenticated user to login', () => {
    renderProtectedRoute(['RESTAURANT']);

    expect(screen.getByText('Login Landing')).toBeInTheDocument();
    expect(screen.queryByText('Restaurant Protected Content')).not.toBeInTheDocument();
  });

  it('allows a RESTAURANT user into restaurant-only routes', () => {
    renderProtectedRoute(['RESTAURANT'], makeToken('RESTAURANT'));

    expect(screen.getByText('Restaurant Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Landing')).not.toBeInTheDocument();
  });

  it('rejects an ADMIN user from restaurant-only routes', () => {
    renderProtectedRoute(['RESTAURANT'], makeToken('ADMIN'));

    expect(screen.getByText('Login Landing')).toBeInTheDocument();
    expect(screen.queryByText('Restaurant Protected Content')).not.toBeInTheDocument();
  });

  it('rejects a CUSTOMER user from restaurant-only routes', () => {
    renderProtectedRoute(['RESTAURANT'], makeToken('CUSTOMER'));

    expect(screen.getByText('Login Landing')).toBeInTheDocument();
    expect(screen.queryByText('Restaurant Protected Content')).not.toBeInTheDocument();
  });

  it('redirects when the token payload is malformed', () => {
    renderProtectedRoute(['RESTAURANT'], 'this-is-not-a-valid-jwt');

    expect(screen.getByText('Login Landing')).toBeInTheDocument();
    expect(screen.queryByText('Restaurant Protected Content')).not.toBeInTheDocument();
  });

  it('allows any authenticated role when allowedRoles is omitted', () => {
    renderProtectedRoute(undefined, makeToken('CUSTOMER'));

    expect(screen.getByText('Restaurant Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Landing')).not.toBeInTheDocument();
  });
});